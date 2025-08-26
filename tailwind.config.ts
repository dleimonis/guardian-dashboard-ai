import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				// Surface colors for glass morphism
				surface: {
					DEFAULT: 'hsl(var(--surface))',
					glass: 'hsl(var(--surface-glass))',
					elevated: 'hsl(var(--surface-elevated))',
				},
				
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					glow: 'hsl(var(--secondary-glow))',
				},
				
				// Status colors with glow variants
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					glow: 'hsl(var(--success-glow))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					glow: 'hsl(var(--warning-glow))',
				},
				critical: {
					DEFAULT: 'hsl(var(--critical))',
					foreground: 'hsl(var(--critical-foreground))',
					glow: 'hsl(var(--critical-glow))',
				},
				
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					glass: 'hsl(var(--card-glass))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			
			// Custom utilities for Crisis Command Center
			backdropBlur: {
				'glass': '12px',
			},
			boxShadow: {
				'glow': 'var(--shadow-glow)',
				'glow-secondary': 'var(--shadow-glow-secondary)', 
				'glass': 'var(--shadow-glass)',
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-surface': 'var(--gradient-surface)',
			},
			
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				
				// Crisis-specific animations
				'pulse-glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
						transform: 'scale(1)'
					},
					'50%': {
						boxShadow: '0 0 40px hsl(var(--primary) / 0.6)',
						transform: 'scale(1.05)'
					}
				},
				'emergency-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 hsl(var(--critical) / 0.7)',
						transform: 'scale(1)'
					},
					'50%': {
						boxShadow: '0 0 0 20px hsl(var(--critical) / 0)',
						transform: 'scale(1.1)'
					}
				},
				'status-blink': {
					'0%, 50%': { opacity: '1' },
					'51%, 100%': { opacity: '0.3' }
				},
				'slide-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				
				// New enhanced animations
				'agent-pulse': {
					'0%, 100%': {
						transform: 'scale(1)',
						opacity: '1'
					},
					'50%': {
						transform: 'scale(1.02)',
						opacity: '0.95'
					}
				},
				'radar-sweep': {
					'0%': {
						transform: 'rotate(0deg)',
						opacity: '0.8'
					},
					'100%': {
						transform: 'rotate(360deg)',
						opacity: '0.8'
					}
				},
				'slide-in-right-glow': {
					'0%': {
						transform: 'translateX(100%)',
						opacity: '0',
						boxShadow: '0 0 0 hsl(var(--primary) / 0)'
					},
					'50%': {
						transform: 'translateX(0)',
						opacity: '1',
						boxShadow: '0 0 20px hsl(var(--primary) / 0.6)'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1',
						boxShadow: '0 0 10px hsl(var(--primary) / 0.3)'
					}
				},
				'heartbeat': {
					'0%': {
						strokeDashoffset: '1000'
					},
					'100%': {
						strokeDashoffset: '0'
					}
				},
				'heartbeat-line': {
					'0%, 20%, 40%, 60%, 80%, 100%': {
						strokeDashoffset: '0'
					},
					'10%, 30%, 50%, 70%, 90%': {
						strokeDashoffset: '10'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'emergency-pulse': 'emergency-pulse 1.5s ease-in-out infinite',
				'status-blink': 'status-blink 2s ease-in-out infinite',
				'slide-up': 'slide-up 0.3s ease-out',
				'agent-pulse': 'agent-pulse 3s ease-in-out infinite',
				'radar-sweep': 'radar-sweep 5s linear infinite',
				'slide-in-right-glow': 'slide-in-right-glow 0.6s ease-out',
				'heartbeat': 'heartbeat 2s ease-in-out infinite',
				'heartbeat-line': 'heartbeat-line 1.5s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
