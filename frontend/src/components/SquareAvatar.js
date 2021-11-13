import React, {useEffect, useState} from 'react';
import seedrandom from 'seedrandom';

function SquareAvatar(props) {
    const [state, setState] = useState({
        rects: [],
        avatarHeight: 0,
        avatarWidth: 0,
        viewBox: null,
        transform: null,
    });
    
    useEffect(() => {
        let rows, columns, avatarWidth, avatarHeight, r, g, b, x, y, fill,
            translateX, translateY, rotate, transform, blockSize, maxBlockSize;
        const rects = [];

        const rng = seedrandom(props.seed);

        function getRandomRange(min, max) {
            return Math.floor(rng() * (max - min) + min);
        }

        function getRandomRangeInIncrementsOf10(min, max) {
            return Math.round((rng()*(max-min)+min)/10)*10;
        }

        avatarWidth = parseInt(props.width, 10);
        avatarHeight = parseInt(props.height, 10);

        maxBlockSize = (avatarHeight - 10);

        if (avatarWidth < avatarHeight) {
            maxBlockSize = avatarWidth
        }

        blockSize = getRandomRangeInIncrementsOf10(50, maxBlockSize);

        if (props.rotate === undefined) {
            rotate = getRandomRangeInIncrementsOf10(10, 80);
        } else {
            rotate = parseInt(props.rotate, 10);
        }

        // add extra squares to allow for smaller squares than viewBox and also rotation
        if (avatarHeight === avatarWidth) {
            if (rotate === 0) {
                translateX = 0;
                translateY = 0;
                transform = `translate(${0} ${0})`;
                rows = ((Math.ceil(avatarHeight / blockSize)));
                columns = ((Math.ceil(avatarWidth / blockSize)));
                transform = `translate(${translateX} ${translateY}) rotate(${rotate} ${avatarWidth} ${avatarHeight})`;
            } else {
                translateX = -Math.abs(avatarHeight / 2);
                translateY = -Math.abs(avatarWidth / 2);
                transform = `translate(${0} ${0})`;
                rows = ((Math.ceil((avatarHeight * 2) / blockSize)));
                columns = ((Math.ceil((avatarWidth * 2) / blockSize)));
                transform = `translate(${translateX} ${translateY}) rotate(${rotate} ${avatarWidth} ${avatarHeight})`;
            }
        } else if (avatarHeight > avatarWidth) {
            if (rotate === 0) {
                translateX = 0;
                translateY = 0;
                transform = `translate(${0} ${0})`;
                rows = ((Math.ceil(avatarHeight / blockSize)));
                columns = ((Math.ceil(avatarWidth / blockSize)));
                transform = `translate(${translateX} ${translateY}) rotate(${rotate} ${avatarWidth} ${avatarHeight})`;
            } else {
                translateX = -Math.abs(avatarHeight / 2);
                translateY = -Math.abs(avatarWidth);
                transform = `translate(${0} ${0})`;
                rows = ((Math.ceil((avatarHeight * 2) / blockSize)));
                columns = ((Math.ceil((avatarWidth * 3) / blockSize)));
                transform = `translate(${translateX} ${translateY}) rotate(${rotate} ${avatarWidth} ${avatarHeight})`;
            }
        } else if (avatarHeight < avatarWidth) {
            if (rotate === 0) {
                translateX = 0;
                translateY = 0;
                transform = `translate(${0} ${0})`;
                rows = ((Math.ceil(avatarHeight / blockSize)));
                columns = ((Math.ceil(avatarWidth / blockSize)));
                transform = `translate(${translateX} ${translateY}) rotate(${rotate} ${avatarWidth} ${avatarHeight})`;
            } else {
                translateX = -Math.abs(avatarHeight / 2);
                translateY = -Math.abs(avatarWidth / 4);
                transform = `translate(${0} ${0})`;
                rows = ((Math.ceil((avatarHeight * 4) / blockSize)));
                columns = ((Math.ceil((avatarWidth * 2) / blockSize)));
                transform = `translate(${translateX} ${translateY}) rotate(${rotate} ${avatarWidth} ${avatarHeight})`;
            }
        }

        const viewBox = `0 0 ${avatarWidth} ${avatarHeight}`;

        let key = 1;
        for (let i = 0; i < columns; i++) {
            for (let j = 0; j < rows; j++) {
                key += 1;
                r = getRandomRange(0, 255);
                g = getRandomRange(0, 255);
                b = getRandomRange(0, 255);
                x = i * blockSize;
                y = j * blockSize;
                fill = 'rgba(' + r + ',' + g + ',' + b + ',1)';
                rects.push(<rect key={key} height={blockSize} width={blockSize} fill={fill} x={x} y={y} />);
            }
        }

        console.log(`Rendered avatar with seed ${props.seed}`);
        setState({
            rects,
            viewBox,
            avatarHeight,
            avatarWidth,
            transform
        });
    }, [props.width, props.height, props.seed, props.rotate]);

    return (
        <div>
            <svg xmlnsXlink="http://www.w3.org/1999/xlink"
                 height={state.avatarHeight}
                 width={state.avatarWidth}
                 viewBox={state.viewBox} >
                <g transform={state.transform}>
                    {state.rects}
                </g>
            </svg>
        </div>
    )
}

export default SquareAvatar;