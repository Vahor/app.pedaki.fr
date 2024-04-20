import type { IconProps } from "@pedaki/design/ui/icons";
import { cn } from "@pedaki/design/utils";
import classes from "./CircleOpacityEffect.module.css";

const CircleOpacityEffect = ({
	loadingIndicator,
	...props
}: IconProps & { loadingIndicator?: boolean }) => {
	return (
		<svg
			viewBox="0 0 1650 1650"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="presentation"
			{...props}
		>
			<circle
				cx="825"
				cy="825"
				r="224.5"
				stroke="currentColor"
				strokeOpacity="1"
				className={cn(loadingIndicator && classes.animation)}
			/>
			<circle
				cx="825"
				cy="825"
				r="374.5"
				stroke="currentColor"
				strokeOpacity="0.8"
				className={cn(loadingIndicator && classes.animation)}
			/>
			<circle
				cx="825"
				cy="825"
				r="524.5"
				stroke="currentColor"
				strokeOpacity="0.6"
				className={cn(loadingIndicator && classes.animation)}
			/>
			<circle
				cx="825"
				cy="825"
				r="674.5"
				stroke="currentColor"
				strokeOpacity="0.4"
				className={cn(loadingIndicator && classes.animation)}
			/>
		</svg>
	);
};

export default CircleOpacityEffect;
