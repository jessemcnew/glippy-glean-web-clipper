export function GleanLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <svg viewBox='0 0 24 24' fill='none' className='w-full h-full'>
        {/* Main G shape */}
        <path
          d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.76 0 5.26-1.12 7.07-2.93'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          fill='none'
        />
        {/* Inner connecting line */}
        <path
          d='M12 8h6v4h-3'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        />
        {/* Glowing dot */}
        <circle cx='18' cy='10' r='1.5' fill='currentColor' className='animate-pulse' />
      </svg>
    </div>
  );
}
