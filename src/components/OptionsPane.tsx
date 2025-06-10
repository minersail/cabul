/* eslint-disable @typescript-eslint/no-explicit-any */
import { Walter_Turncoat } from 'next/font/google';

const walterTurncoat = Walter_Turncoat({
  weight: '400',
  subsets: ['latin'],
});

// Configuration for different option types
export interface OptionConfig {
  id: string;
  label: string;
  type: 'boolean' | 'select';
  value: any;
  onChange: (value: any) => void;
  options?: { value: any; label: string }[]; // For select type
}

export interface OptionsPaneProps {
  options: OptionConfig[];
}

// Shared checkbox-style input component
interface CheckboxStyleInputProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  index: number;
  type?: 'checkbox' | 'radio';
  name?: string;
}

function CheckboxStyleInput({ 
  id, 
  checked, 
  onChange, 
  index, 
  type = 'checkbox',
  name 
}: CheckboxStyleInputProps) {
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <input
        id={id}
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div 
        className={`absolute inset-0 rounded-sm ${checked ? 'border-[black]' : ''}`}
        style={{
          border: '2px solid black',
          borderTopWidth: '3px',
          borderRightWidth: '2px',
          borderRadius: '2px',
          transform: `rotate(${index % 2 === 0 ? '-2' : '1'}deg)`,
          boxShadow: checked ? '0 0 2px rgba(30,136,229,0.4)' : 'none'
        }}
      />
      {checked && (
        <div 
          className="text-[black] text-2xl font-bold pointer-events-none absolute" 
          style={{ 
            textShadow: '0 0 1px rgba(30,136,229,0.4)',
            filter: 'blur(0.3px)',
            transform: `rotate(${index % 2 === 0 ? '-5' : '3'}deg) translate(-1px, -2px)`,
            opacity: 0.9
          }}
        >
          ✗
        </div>
      )}
    </div>
  );
}

// Shared label component
interface OptionLabelProps {
  text: string;
  size?: 'sm' | 'xs';
}

function OptionLabel({ text, size = 'sm' }: OptionLabelProps) {
  return (
    <span 
      className={`${walterTurncoat.className} text-${size} pointer-events-none`}
      style={{
        filter: 'blur(0.3px)',
        color: 'black',
        opacity: size === 'sm' ? 0.9 : 0.8
      }}
    >
      {text}
    </span>
  );
}

export default function OptionsPane({ options }: OptionsPaneProps) {
  const renderBooleanOption = (option: OptionConfig, index: number) => (
    <div key={option.id} className="relative group">
      <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded"></div>
      <label htmlFor={option.id} className="relative z-20 flex items-center gap-3 cursor-pointer">
        <CheckboxStyleInput
          id={option.id}
          checked={!!option.value}
          onChange={() => option.onChange(!option.value)}
          index={index}
          type="checkbox"
        />
        <OptionLabel text={option.label} />
      </label>
    </div>
  );

  const renderSelectOption = (option: OptionConfig, index: number) => (
    <div key={option.id} className="relative group">
      <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded"></div>
      <div className="relative z-20">
        <OptionLabel text={option.label} />
        <div className="space-y-2 mt-2">
          {option.options?.map((selectOption, selectIndex) => (
            <label 
              key={selectOption.value} 
              htmlFor={`${option.id}-${selectOption.value}`} 
              className="flex items-center gap-3 cursor-pointer"
            >
              <CheckboxStyleInput
                id={`${option.id}-${selectOption.value}`}
                checked={option.value === selectOption.value}
                onChange={() => option.onChange(selectOption.value)}
                index={index + selectIndex}
                type="radio"
                name={option.id}
              />
              <OptionLabel text={selectOption.label} size="xs" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOption = (option: OptionConfig, index: number) => {
    switch (option.type) {
      case 'boolean':
        return renderBooleanOption(option, index);
      case 'select':
        return renderSelectOption(option, index);
      default:
        return null;
    }
  };

  return (
    <div className="mt-4">
      <div className="rounded-lg p-[6px] shadow-lg"
           style={{
             background: 'linear-gradient(45deg, #b8b8b8 0%, rgb(194, 194, 194) 25%, #b0b0b0 50%, #c8c8c8 75%, #e0e0e0 100%)',
           }}>
        {/* Whiteboard surface */}
        <div className="relative rounded-md overflow-hidden"
             style={{
               background: '#ffffff',
               boxShadow: `
                 inset 0 0 40px rgba(0,0,0,0.1),
                 inset 0 0 80px rgba(0,0,0,0.05)
               `,
             }}>
          
          {/* Black corner pieces (typical of real whiteboards) */}
          <div className="absolute top-0 left-0 w-3 h-3 bg-black rounded-br-lg opacity-80"></div>
          <div className="absolute top-0 right-0 w-3 h-3 bg-black rounded-bl-lg opacity-80"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 bg-black rounded-tr-lg opacity-80"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-black rounded-tl-lg opacity-80"></div>
          
          {/* Marker smudge textures */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{
                 background: `
                   radial-gradient(ellipse 120px 80px at 20% 30%, rgba(100,100,100,0.8) 0%, transparent 60%),
                   radial-gradient(ellipse 80px 60px at 80% 70%, rgba(150,150,150,0.6) 0%, transparent 50%),
                   radial-gradient(ellipse 100px 40px at 60% 20%, rgba(120,120,120,0.4) 0%, transparent 70%),
                   radial-gradient(ellipse 60px 90px at 30% 80%, rgba(110,110,110,0.5) 0%, transparent 60%)
                 `
               }}>
          </div>
          
          {/* Additional subtle marker streaks */}
          <div className="absolute inset-0 opacity-[0.02]" 
               style={{
                 background: `
                   linear-gradient(25deg, transparent 40%, rgba(100,100,100,0.3) 42%, rgba(100,100,100,0.3) 44%, transparent 46%),
                   linear-gradient(-15deg, transparent 60%, rgba(120,120,120,0.2) 62%, rgba(120,120,120,0.2) 63%, transparent 65%),
                   linear-gradient(70deg, transparent 20%, rgba(90,90,90,0.25) 22%, rgba(90,90,90,0.25) 24%, transparent 26%)
                 `
               }}>
          </div>
          
          <div className="p-6 relative z-10">
            {/* Very subtle paper-like texture */}
            <div className="absolute inset-0 opacity-[0.015]" 
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                   backgroundSize: '150px 150px',
                 }}>
            </div>
            
            {/* Dynamic options rendering */}
            <div className="space-y-4 relative z-20">
              {options.map((option, index) => renderOption(option, index))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 