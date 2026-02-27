const StarBorder = ({
    as: Component = 'button',
    className = '',
    color = '#22c55e',
    speed = '5s',
    thickness = 1,
    children,
    style: externalStyle = {},
    ...rest
}) => {
    return (
        <Component
            className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
            style={{ padding: `${thickness}px 0`, ...externalStyle }}
            {...rest}
        >
            {/* Bottom star sweep */}
            <div
                className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full z-0"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animation: `star-movement-bottom ${speed} linear infinite alternate`,
                }}
            />
            {/* Top star sweep */}
            <div
                className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full z-0"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animation: `star-movement-top ${speed} linear infinite alternate`,
                }}
            />
            {/* Inner button face */}
            <div className="relative z-[1] border border-white/10 text-white text-center text-[16px] py-[14px] px-[28px] rounded-[20px] bg-gradient-to-b from-dark-800 to-dark-900 whitespace-nowrap">
                {children}
            </div>
        </Component>
    );
};

export default StarBorder;
