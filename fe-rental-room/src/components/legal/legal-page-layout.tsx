import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

interface LegalPageLayoutProps {
    title: string;
    lastUpdated: string;
    version: string;
    description?: string;
    children: ReactNode;
    legalBasis?: string[];
}

export function LegalPageLayout({
    title,
    lastUpdated,
    version,
    description,
    children,
    legalBasis,
}: LegalPageLayoutProps) {
    return (
        <div className="container max-w-4xl py-10">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-4xl font-bold mb-2">{title}</h1>
                <p className="text-muted-foreground">
                    Cập nhật lần cuối: {lastUpdated} | Phiên bản: {version}
                </p>
                {description && (
                    <p className="text-sm text-muted-foreground mt-2">{description}</p>
                )}
            </header>

            {/* Content */}
            <div className="space-y-8">{children}</div>

            {/* Legal Basis */}
            {legalBasis && legalBasis.length > 0 && (
                <>
                    <Separator className="my-8" />
                    <footer className="text-sm text-muted-foreground">
                        <p className="mb-2">
                            <strong>Cơ sở pháp lý:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            {legalBasis.map((law, index) => (
                                <li key={index}>{law}</li>
                            ))}
                        </ul>
                    </footer>
                </>
            )}
        </div>
    );
}

interface LegalSectionProps {
    title: string;
    icon?: IconComponent;
    children: ReactNode;
}

export function LegalSection({ title, icon: Icon, children }: LegalSectionProps) {
    return (
        <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                {Icon && <Icon className="h-6 w-6" />}
                {title}
            </h2>
            {children}
        </section>
    );
}

interface LegalCardProps {
    title?: string;
    icon?: IconComponent;
    children: ReactNode;
}

export function LegalCard({ title, icon: Icon, children }: LegalCardProps) {
    if (title) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {Icon && <Icon className="h-5 w-5" />}
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">{children}</CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-6 space-y-3">{children}</CardContent>
        </Card>
    );
}

interface LegalListProps {
    items: string[];
    ordered?: boolean;
}

export function LegalList({ items, ordered = false }: LegalListProps) {
    const ListTag = ordered ? 'ol' : 'ul';
    const listClass = ordered ? 'list-decimal' : 'list-disc';

    return (
        <ListTag className={`${listClass} list-inside space-y-1 text-muted-foreground ml-4`}>
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ListTag>
    );
}

interface LegalHighlightProps {
    label: string;
    content: string | ReactNode;
    color?: 'primary' | 'blue' | 'amber' | 'green';
}

export function LegalHighlight({ label, content, color = 'primary' }: LegalHighlightProps) {
    const colorClasses = {
        primary: 'border-primary',
        blue: 'border-blue-500',
        amber: 'border-amber-500',
        green: 'border-green-500',
    };

    return (
        <div className={`border-l-4 ${colorClasses[color]} pl-4`}>
            <p className="font-semibold">{label}</p>
            {typeof content === 'string' ? (
                <p className="text-sm text-muted-foreground">{content}</p>
            ) : (
                content
            )}
        </div>
    );
}
