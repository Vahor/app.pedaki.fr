import { Separator } from "@pedaki/design/ui/separator";
import React from "react";

interface PageHeaderProps {
	title: string;
	description: string;
}

const PageHeader = ({ title, description }: PageHeaderProps) => {
	return (
		<div className="relative flex flex-col items-center pb-6">
			<div>
				<div
					className="absolute inset-0 -z-10 h-full w-full -translate-y-1/3 bgi-grid-neutral-400/100"
					style={{
						maskImage: "radial-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0))",
						WebkitMaskImage: "radial-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0))",
						backgroundPositionY: "-16px",
						backgroundPositionX: "-16px",
					}}
				></div>
				<h1 className="text-center text-title-5 text-main">{title}</h1>
				<p className="text-center text-p-md text-sub">{description}</p>
			</div>
			<Separator orientation="horizontal" className="mt-6 bg-stroke-soft" />
		</div>
	);
};

export default PageHeader;
