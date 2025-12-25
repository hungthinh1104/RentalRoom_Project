import React from 'react';

export default function PropertyPage({ params }: { params: { id: string } }) {
	return <div className="container py-6">Property ID: {params.id}</div>;
}
