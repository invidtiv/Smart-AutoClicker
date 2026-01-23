import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ParsedBackup, parseBackupZip } from '../utils/zipHandler';

interface FileUploaderProps {
  onFileParsed: (data: ParsedBackup) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileParsed }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length === 0) {
      setError('Please upload a .zip file.');
      return;
    }

    const file = acceptedFiles[0];
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      setError('Invalid file type. Please upload a .zip file.');
      return;
    }

    try {
      setIsLoading(true);
      const parsedData = await parseBackupZip(file);
      onFileParsed(parsedData);
    } catch (err) {
      console.error('Error parsing zip file:', err);
      setError('Failed to parse the backup file. It might be corrupted or an unsupported format.');
    } finally {
      setIsLoading(false);
    }
  }, [onFileParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
  });

  return (
    <div className="file-uploader-container">
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed',
          borderColor: isDragActive ? 'var(--primary)' : 'var(--border-color)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <input {...getInputProps()} />

        {/* Upload Icon */}
        <div style={{ marginBottom: '1.5rem' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto',
              color: isDragActive ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.3s ease',
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
        </div>

        {isLoading ? (
          <div>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Processing backup file...
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : isDragActive ? (
          <div>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--primary)',
                marginBottom: '0.5rem',
              }}
            >
              Drop your file here
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Release to upload
            </p>
          </div>
        ) : (
          <div>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}
            >
              Drop your Klick'r backup here
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              or click to browse files
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                style={{ width: '14px', height: '14px' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              .zip files only
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="var(--error)"
            style={{ width: '20px', height: '20px', flexShrink: 0 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
