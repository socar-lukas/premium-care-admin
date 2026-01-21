'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface BulkUploadResult {
  success: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; vehicleNumber: string; error: string }>;
}

interface BulkUploadProps {
  onComplete?: () => void;
  onClose: () => void;
}

interface VehicleRow {
  rowNum: number;
  car_num: string;
  car_name?: string;
  car_model?: string;
  maker?: string;
  engine?: string;
  model_year?: string | number;
  fuel?: string;
}

type UploadStatus = 'idle' | 'analyzing' | 'uploading' | 'complete' | 'error';

export default function BulkUpload({ onComplete, onClose }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [parsedRows, setParsedRows] = useState<VehicleRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeFile = async (selectedFile: File): Promise<VehicleRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

          // 필수 컬럼 확인
          if (rows.length > 0 && !('car_num' in rows[0])) {
            reject(new Error(`필수 컬럼 'car_num'이 없습니다. 발견된 컬럼: ${Object.keys(rows[0]).join(', ')}`));
            return;
          }

          const vehicleRows: VehicleRow[] = rows.map((row, index) => ({
            rowNum: index + 2, // 헤더 + 1-based
            car_num: String(row.car_num || '').trim(),
            car_name: row.car_name ? String(row.car_name).trim() : undefined,
            car_model: row.car_model ? String(row.car_model).trim() : undefined,
            maker: row.maker ? String(row.maker).trim() : undefined,
            engine: row.engine ? String(row.engine).trim() : undefined,
            model_year: row.model_year,
            fuel: row.fuel ? String(row.fuel).trim() : undefined,
          })).filter(row => row.car_num); // 차량번호가 있는 행만

          resolve(vehicleRows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsArrayBuffer(selectedFile);
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('CSV 또는 Excel 파일만 업로드 가능합니다.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setStatus('analyzing');
    setStatusMessage('파일 분석 중...');

    try {
      const rows = await analyzeFile(selectedFile);
      setParsedRows(rows);
      setTotalRows(rows.length);
      setStatus('idle');
      setStatusMessage(`${rows.length}개 차량 데이터 확인됨`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 분석에 실패했습니다.');
      setStatus('error');
      setFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // 개별 차량 등록/업데이트 API 호출
  const upsertVehicle = async (row: VehicleRow, adminPin: string): Promise<{ success: boolean; updated: boolean; error?: string }> => {
    try {
      // 연식 파싱
      let year: number | null = null;
      if (row.model_year) {
        const yearStr = String(row.model_year).trim();
        const yearMatch = yearStr.match(/^(\d{2,4})/);
        if (yearMatch) {
          let yearNum = parseInt(yearMatch[1]);
          if (yearNum < 100) yearNum = 2000 + yearNum;
          if (yearNum >= 1900 && yearNum <= 2100) year = yearNum;
        }
      }

      const response = await fetch('/api/vehicles/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({
          vehicleNumber: row.car_num,
          ownerName: row.car_name || row.car_num,
          model: row.car_name || null,
          manufacturer: row.maker || null,
          vehicleType: row.car_model || null,
          year,
          engine: row.engine || null,
          fuel: row.fuel || null,
        }),
      });

      // 응답 텍스트 먼저 가져오기
      const responseText = await response.text();

      // JSON 파싱 시도
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error('JSON parse error for vehicle:', row.car_num, responseText.substring(0, 100));
        return { success: false, updated: false, error: `서버 오류: ${response.status}` };
      }

      if (!response.ok) {
        return { success: false, updated: false, error: data.error || `HTTP ${response.status}` };
      }

      return { success: true, updated: data.updated || false };
    } catch (err) {
      console.error('Network error for vehicle:', row.car_num, err);
      return { success: false, updated: false, error: err instanceof Error ? err.message : '네트워크 오류' };
    }
  };

  const handleUpload = async () => {
    if (parsedRows.length === 0) return;

    setStatus('uploading');
    setStatusMessage('차량 등록 중...');
    setProcessedCount(0);
    setError(null);

    const adminPin = sessionStorage.getItem('adminPin') || '';
    const uploadResult: BulkUploadResult = {
      success: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    // 3개씩 병렬 처리
    const BATCH_SIZE = 3;
    for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
      const batch = parsedRows.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(row => upsertVehicle(row, adminPin))
      );

      results.forEach((res, idx) => {
        const row = batch[idx];
        if (res.success) {
          if (res.updated) {
            uploadResult.updated++;
          } else {
            uploadResult.success++;
          }
        } else {
          uploadResult.failed++;
          uploadResult.errors.push({
            row: row.rowNum,
            vehicleNumber: row.car_num,
            error: res.error || '알 수 없는 오류',
          });
        }
      });

      setProcessedCount(Math.min(i + BATCH_SIZE, parsedRows.length));
      setStatusMessage(`차량 등록 중... (${Math.min(i + BATCH_SIZE, parsedRows.length)}/${parsedRows.length})`);
    }

    setResult(uploadResult);
    setStatus('complete');
    setStatusMessage('완료!');

    if (onComplete) {
      onComplete();
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setStatus('idle');
    setTotalRows(0);
    setProcessedCount(0);
    setStatusMessage('');
    setParsedRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const progressPercent = totalRows > 0 ? Math.round((processedCount / totalRows) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/20">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">차량 일괄 등록</h2>
            <button
              onClick={onClose}
              disabled={status === 'uploading'}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 진행 중 화면 */}
          {status === 'uploading' && (
            <div className="py-8">
              <div className="flex flex-col items-center">
                {/* 애니메이션 아이콘 */}
                <div className="relative mb-6">
                  <svg className="w-20 h-20 text-blue-500" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                    <circle
                      className="opacity-75"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${progressPercent * 0.628} 62.8`}
                      strokeLinecap="round"
                      transform="rotate(-90 12 12)"
                      style={{ transition: 'stroke-dasharray 0.3s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">{progressPercent}%</span>
                  </div>
                </div>

                {/* 상태 메시지 */}
                <p className="text-lg font-medium text-gray-900 mb-2">{statusMessage}</p>
                <p className="text-sm text-gray-500">
                  {processedCount} / {totalRows} 건 처리됨
                </p>

                {/* 프로그레스 바 */}
                <div className="w-full mt-6 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #0078FF 0%, #00D4AA 100%)',
                    }}
                  />
                </div>

                {/* 안내 메시지 */}
                <p className="text-xs text-gray-400 mt-4">
                  창을 닫지 마세요. 처리가 완료될 때까지 기다려주세요.
                </p>
              </div>
            </div>
          )}

          {/* 파일 선택 / 분석 화면 */}
          {(status === 'idle' || status === 'analyzing' || status === 'error') && !result && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => status !== 'analyzing' && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  status === 'analyzing'
                    ? 'border-blue-400 bg-blue-50 cursor-wait'
                    : dragOver
                    ? 'border-blue-500 bg-blue-50 cursor-pointer'
                    : file
                    ? 'border-green-500 bg-green-50 cursor-pointer'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {status === 'analyzing' ? (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin w-12 h-12 text-blue-500 mb-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="font-medium text-blue-700">파일 분석 중...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    {totalRows > 0 && (
                      <p className="text-sm font-medium text-green-600 mt-2">
                        {totalRows}개 차량 데이터 확인됨
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="font-medium text-gray-700">파일을 드래그하거나 클릭하여 선택</p>
                    <p className="text-sm text-gray-500 mt-1">CSV, XLSX, XLS 파일 지원</p>
                  </div>
                )}
              </div>

              {/* 파일 형식 안내 */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-medium text-blue-900 mb-2">필수 컬럼</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><code className="bg-blue-100 px-1.5 py-0.5 rounded">car_num</code> - 차량번호</p>
                  <p><code className="bg-blue-100 px-1.5 py-0.5 rounded">car_name</code> - 모델명</p>
                  <p><code className="bg-blue-100 px-1.5 py-0.5 rounded">car_model</code> - 차량 유형</p>
                  <p><code className="bg-blue-100 px-1.5 py-0.5 rounded">maker</code> - 제조사</p>
                  <p><code className="bg-blue-100 px-1.5 py-0.5 rounded">engine</code> - 엔진</p>
                  <p><code className="bg-blue-100 px-1.5 py-0.5 rounded">model_year</code> - 연식</p>
                  <p><code className="bg-blue-100 px-1.5 py-0.5 rounded">fuel</code> - 연료</p>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 whitespace-pre-wrap">{error}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || status === 'analyzing' || totalRows === 0}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}
                >
                  {totalRows > 0 ? `${totalRows}개 차량 등록` : '업로드'}
                </button>
              </div>
            </>
          )}

          {/* 결과 표시 */}
          {result && status === 'complete' && (
            <div className="space-y-4">
              {/* 성공 아이콘 */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <p className="text-center text-lg font-medium text-gray-900 mb-4">
                차량 등록이 완료되었습니다!
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{result.success}</p>
                  <p className="text-sm text-green-700">신규 등록</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                  <p className="text-sm text-blue-700">업데이트</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-sm text-red-700">실패</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-red-900 mb-2">오류 상세</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {result.errors.map((err, i) => (
                      <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
                        <p className="text-red-800">
                          <span className="font-medium">행 {err.row}</span> ({err.vehicleNumber}): {err.error}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  다시 업로드
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-semibold shadow-lg transition-all"
                  style={{ background: 'linear-gradient(135deg, #0078FF 0%, #005AFF 100%)' }}
                >
                  완료
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
