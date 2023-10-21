import React from 'react';
import type {IconProps} from "@pedaki/design/ui/icons";

const CircleOpacityEffect = (props: IconProps) => {
    return (
        <svg  viewBox="0 0 1650 1650" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="825" cy="825" r="224.5" stroke="currentColor" strokeOpacity="0.8"/>
            <circle cx="825" cy="825" r="374.5" stroke="currentColor" strokeOpacity="0.6"/>
            <circle cx="825" cy="825" r="524.5" stroke="currentColor" strokeOpacity="0.4"/>
            <circle cx="825" cy="825" r="674.5" stroke="currentColor" strokeOpacity="0.2"/>
        </svg>

    );
};

export default CircleOpacityEffect;