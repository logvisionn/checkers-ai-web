import React from 'react';

export default function Piece({ value }) {
  if (value === 0) return null;

  const isHuman = value > 0;          // human’s pieces are positive
  const isKing  = Math.abs(value) === 2;

  const style = {
    width:        '80%',
    height:       '80%',
    borderRadius: '50%',
    backgroundColor: isHuman ? '#ffffff' : '#000000',
    boxShadow:    isHuman
      ? '0 0 0 1px rgba(0,0,0,0.25)'
      : '0 0 0 1px rgba(255,255,255,0.25)',
    border: isKing ? '3px solid #FFD700' : '1px solid rgba(0,0,0,0.2)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div className="piece" style={style}>
      {isKing && (
        <span style={{
          fontSize: '1.5em',
          color: isHuman ? '#FFD700' : '#FFF',
          lineHeight: 1,
        }}>
          ♕
        </span>
      )}
    </div>
  );
}