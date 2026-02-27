import { useRef } from 'react';

const GlareHover = ({
    width = '100%',
    height = '100%',
    background = 'transparent',
    borderRadius = '24px',
    borderColor = 'transparent',
    children,
    glareColor = '#22c55e',
    glareOpacity = 0.25,
    glareAngle = -30,
    glareSize = 300,
    transitionDuration = 800,
    playOnce = false,
    className = '',
    style = {}
}) => {
    const hex = glareColor.replace('#', '');
    let rgba = glareColor;
    if (/^[\dA-Fa-f]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
    }

    const overlayRef = useRef(null);

    const animateIn = () => {
        const el = overlayRef.current;
        if (!el) return;
        el.style.transition = 'none';
        el.style.backgroundPosition = '-100% -100%, 0 0';
        requestAnimationFrame(() => {
            el.style.transition = `${transitionDuration}ms ease`;
            el.style.backgroundPosition = '100% 100%, 0 0';
        });
    };

    const animateOut = () => {
        const el = overlayRef.current;
        if (!el) return;
        if (playOnce) {
            el.style.transition = 'none';
            el.style.backgroundPosition = '-100% -100%, 0 0';
        } else {
            el.style.transition = `${transitionDuration}ms ease`;
            el.style.backgroundPosition = '-100% -100%, 0 0';
        }
    };

    const overlayStyle = {
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(${glareAngle}deg, hsla(0,0%,0%,0) 60%, ${rgba} 70%, hsla(0,0%,0%,0) 100%)`,
        backgroundSize: `${glareSize}% ${glareSize}%, 100% 100%`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '-100% -100%, 0 0',
        pointerEvents: 'none',
        borderRadius,
        zIndex: 1,
    };

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{ width, height, background, borderRadius, borderColor, ...style }}
            onMouseEnter={animateIn}
            onMouseLeave={animateOut}
        >
            <div ref={overlayRef} style={overlayStyle} />
            <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
                {children}
            </div>
        </div>
    );
};

export default GlareHover;
