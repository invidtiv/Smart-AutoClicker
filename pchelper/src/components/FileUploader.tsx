import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ParsedBackup, parseBackupZip } from '../utils/zipHandler';

interface FileUploaderProps {
  onFileParsed: (data: ParsedBackup) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileParsed }) => {
  const [error, setError] = useState<string | null>(null);

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
      const parsedData = await parseBackupZip(file);
      onFileParsed(parsedData);
    } catch (err) {
      console.error('Error parsing zip file:', err);
      setError('Failed to parse the backup file. It might be corrupted or an unsupported format.');
    }
  }, [onFileParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: '2px dashed #cccccc',
        borderRadius: '4px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f0f0f0' : '#ffffff',
      }}
    >
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the .zip file here ...</p> :
          <p>Drag 'n' drop a Klick'r backup .zip file here, or click to select one</p>
      }
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default FileUploader;
