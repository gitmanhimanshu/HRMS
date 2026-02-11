function Avatar({ src, name, size = 'md', className = '' }) {
  const getInitials = (fullName) => {
    if (!fullName) return 'U'
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl'
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ${className}`}>
      <span className="text-white font-bold">
        {getInitials(name)}
      </span>
    </div>
  )
}

export default Avatar
