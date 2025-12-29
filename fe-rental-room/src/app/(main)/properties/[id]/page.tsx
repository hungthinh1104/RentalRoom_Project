import React from 'react';

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <div className="container py-6">Property ID: {id}</div>;
}
