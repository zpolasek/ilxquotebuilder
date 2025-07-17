import React from 'react';

// Card
export const Card = ({ children }) => (
  <div className="border rounded-lg shadow-md bg-white">{children}</div>
);

export const CardContent = ({ children }) => (
  <div className="p-4">{children}</div>
);

// Input
export const Input = ({ type = "text", value, onChange, placeholder, disabled }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);

// Button
export const Button = ({ children, onClick, variant = 'solid', size = 'base' }) => {
  const base = "px-4 py-2 rounded font-semibold focus:outline-none transition-all duration-200";
  const variants = {
    solid: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "text-blue-600 hover:bg-blue-50"
  };
  const sizes = {
    base: "text-sm",
    icon: "p-2"
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.solid} ${sizes[size] || sizes.base}`}
    >
      {children}
    </button>
  );
};

// Label
export const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}
  </label>
);

// Radio Group
export const RadioGroup = ({ value, onValueChange, children }) => (
  <div onChange={(e) => onValueChange(e.target.value)}>
    {children}
  </div>
);

export const RadioGroupItem = ({ value, id }) => (
  <input
    type="radio"
    value={value}
    name={id.split('-')[0]}
    id={id}
    className="mr-1"
  />
);
