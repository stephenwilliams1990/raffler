import React from 'react'
import './css/loader.css'

interface LoaderProps {
  borderColor: string
  borderStyle: string
  borderWidth: string
  height: string
  minHeight: string
  width: string
}

const Loader = (props: LoaderProps) => {
  const { borderColor, borderStyle, borderWidth, height, minHeight, width } =
    props

  const innerDivStyle: React.CSSProperties = {
    borderColor,
    borderStyle,
    borderWidth,
  }
  return (
    <div className="lds-ripple-parent" style={{ minHeight }}>
      <div className="lds-ripple" style={{ height, width }}>
        <div style={innerDivStyle} />
        <div style={innerDivStyle} />
      </div>
    </div>
  )
}

Loader.defaultProps = {
  borderColor: '#ff5d00',
  borderStyle: 'solid',
  borderWidth: '4px',
  height: '64px',
  minHeight: '80vh',
  width: '64px',
}

export { Loader }
