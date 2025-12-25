"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/**
 * Color System Diagnostic Component
 * Tests all CSS variables and Tailwind color classes
 * 
 * Use this to verify colors are rendering correctly
 */
export function ColorDiagnostic() {
	return (
		<div className="min-h-screen bg-background p-8 space-y-8">
			<div className="max-w-6xl mx-auto space-y-8">
				{/* Header */}
				<div>
					<h1 className="text-4xl font-bold text-foreground mb-2">
						Color System Diagnostic
					</h1>
					<p className="text-muted-foreground">
						Verify all CSS variables are working correctly
					</p>
				</div>

				{/* Primary Colors */}
				<Card>
					<CardHeader>
						<CardTitle>Primary Colors</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<ColorSwatch
								name="primary"
								className="bg-primary"
								textClassName="text-primary-foreground"
								value="#FF385C"
							/>
							<ColorSwatch
								name="primary-hover"
								className="bg-primary-hover"
								textClassName="text-primary-foreground"
								value="#E31C5F"
							/>
							<ColorSwatch
								name="primary-light"
								className="bg-primary-light"
								textClassName="text-foreground"
								value="#FFE7EB"
							/>
							<ColorSwatch
								name="primary-foreground"
								className="bg-primary-foreground"
								textClassName="text-primary"
								value="#FFFFFF"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Status Colors */}
				<Card>
					<CardHeader>
						<CardTitle>Status Colors</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<ColorSwatch
								name="success"
								className="bg-success"
								textClassName="text-success-foreground"
								value="#00A699"
							/>
							<ColorSwatch
								name="warning"
								className="bg-warning"
								textClassName="text-warning-foreground"
								value="#FC642D"
							/>
							<ColorSwatch
								name="destructive"
								className="bg-destructive"
								textClassName="text-destructive-foreground"
								value="Red"
							/>
							<ColorSwatch
								name="info"
								className="bg-info"
								textClassName="text-info-foreground"
								value="#1E90FF"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Neutral Colors */}
				<Card>
					<CardHeader>
						<CardTitle>Neutral Colors</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<ColorSwatch
								name="background"
								className="bg-background border-2 border-border"
								textClassName="text-foreground"
								value="White/Dark"
							/>
							<ColorSwatch
								name="foreground"
								className="bg-foreground"
								textClassName="text-background"
								value="Black/White"
							/>
							<ColorSwatch
								name="muted"
								className="bg-muted"
								textClassName="text-muted-foreground"
								value="Gray"
							/>
							<ColorSwatch
								name="border"
								className="bg-border"
								textClassName="text-foreground"
								value="Light Gray"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Buttons */}
				<Card>
					<CardHeader>
						<CardTitle>Button Variants</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-4">
							<Button variant="default">Primary Button</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="destructive">Destructive</Button>
							<Button variant="outline">Outline</Button>
							<Button variant="ghost">Ghost</Button>
							<Button variant="link">Link</Button>
						</div>
					</CardContent>
				</Card>

				{/* Badges */}
				<Card>
					<CardHeader>
						<CardTitle>Badge Variants</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-4">
							<Badge>Default</Badge>
							<Badge variant="secondary">Secondary</Badge>
							<Badge variant="destructive">Destructive</Badge>
							<Badge variant="outline">Outline</Badge>
						</div>
					</CardContent>
				</Card>

				{/* Glassmorphism Test */}
				<Card className="bg-card/80 backdrop-blur-xl">
					<CardHeader>
						<CardTitle>Glassmorphism Effect</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							This card should have a semi-transparent background with blur effect.
							<br />
							Classes: <code className="text-sm bg-muted px-2 py-1 rounded">bg-card/80 backdrop-blur-xl</code>
						</p>
					</CardContent>
				</Card>

				{/* CSS Variables Display */}
				<Card>
					<CardHeader>
						<CardTitle>CSS Variables (Computed)</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
							<CSSVarDisplay varName="--primary" />
							<CSSVarDisplay varName="--primary-hover" />
							<CSSVarDisplay varName="--background" />
							<CSSVarDisplay varName="--foreground" />
							<CSSVarDisplay varName="--success" />
							<CSSVarDisplay varName="--destructive" />
							<CSSVarDisplay varName="--muted" />
							<CSSVarDisplay varName="--border" />
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

function ColorSwatch({
	name,
	className,
	textClassName,
	value,
}: {
	name: string
	className: string
	textClassName: string
	value: string
}) {
	return (
		<div className="space-y-2">
			<div className={`${className} ${textClassName} h-24 rounded-xl flex items-center justify-center font-semibold shadow-lg`}>
				{name}
			</div>
			<div className="text-xs text-muted-foreground text-center">
				{value}
			</div>
		</div>
	)
}

function CSSVarDisplay({ varName }: { varName: string }) {
	const [value, setValue] = React.useState<string>("")

	React.useEffect(() => {
		const computed = getComputedStyle(document.documentElement).getPropertyValue(varName)
		setValue(computed.trim())
	}, [varName])

	return (
		<div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
			<span className="text-foreground font-medium">{varName}</span>
			<span className="text-primary">{value || "Not found"}</span>
		</div>
	)
}
