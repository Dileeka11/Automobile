import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
}

export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-slate-600">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="btn-danger">{confirmText}</button>
      </div>
    </Modal>
  );
}
