import { LogoMark } from './Logo';

interface LogoSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  py?: string;
}

export default function LogoSpinner({
  message = 'Loading…',
  fullScreen = false,
  py = 'py-24',
}: LogoSpinnerProps) {
  const inner = (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl border-[3px] border-[#e4e2e6] border-t-[#070235] animate-spin absolute" />
        <LogoMark size={36} />
      </div>
      <p className="text-[13px] text-[#505f76] font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8ff]">
        {inner}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${py}`}>
      {inner}
    </div>
  );
}
