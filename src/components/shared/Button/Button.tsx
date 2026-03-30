import React from 'react'
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd'

interface ButtonProps extends AntButtonProps {
  // Extend with any custom props if needed
}

const ButtonComponent: React.FC<ButtonProps> = ({ 
  children, 
  ...props 
}) => {
  return (
    <AntButton {...props}>
      {children}
    </AntButton>
  )
}

export default ButtonComponent
