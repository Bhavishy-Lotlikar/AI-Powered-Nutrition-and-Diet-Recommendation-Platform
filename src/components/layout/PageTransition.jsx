import React, { useEffect, useState, useMemo } from 'react';
import './PageTransition.css';

const PageTransition = ({ trigger, onComplete }) => {
    const [phase, setPhase] = useState('idle'); // 'idle', 'in', 'out'
    const [gridConfig, setGridConfig] = useState({ cols: 0, rows: 0, blocks: [] });

    useEffect(() => {
        const updateGrid = () => {
            const blockSize = window.innerWidth < 768 ? 40 : 60; // smaller blocks on mobile
            const cols = Math.ceil(window.innerWidth / blockSize);
            const rows = Math.ceil(window.innerHeight / blockSize);
            const totalBlocks = cols * rows;

            const blocks = Array.from({ length: totalBlocks }).map((_, i) => ({
                id: i,
                delayIn: Math.random() * 0.4, // random delay up to 0.4s for entry
                delayOut: Math.random() * 0.4 // random delay up to 0.4s for exit
            }));

            setGridConfig({ cols, rows, blocks });
        };

        updateGrid();
        window.addEventListener('resize', updateGrid);
        return () => window.removeEventListener('resize', updateGrid);
    }, []);

    // Keep a stable reference to onComplete to avoid dependency cycles
    const onCompleteRef = React.useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (trigger) {
            setPhase('in');

            // Wait for blocks to fade IN (max delay 0.4s + transition 0.4s = ~0.8s)
            const switchTimer = setTimeout(() => {
                onCompleteRef.current(); // Switch underlying page

                // Then trigger the fade OUT sequence
                setPhase('out');

                // After max delay(0.4) + transition(0.4), completely hide the overlay
                setTimeout(() => {
                    setPhase('idle');
                }, 800);
            }, 800);

            return () => clearTimeout(switchTimer);
        }
    }, [trigger]);

    if (!trigger && phase === 'idle') return null;

    return (
        <div
            className="transition-overlay"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`
            }}
        >
            {gridConfig.blocks.map(block => (
                <div
                    key={block.id}
                    className={`transition-block ${phase === 'in' ? 'show' : ''}`}
                    style={{
                        transitionDelay: `${phase === 'in' ? block.delayIn : block.delayOut}s`
                    }}
                />
            ))}
        </div>
    );
};

export default PageTransition;
