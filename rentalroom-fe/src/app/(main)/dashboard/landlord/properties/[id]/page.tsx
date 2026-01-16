import React from 'react';

export default async function LandlordPropertyPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <div className="container py-6">Landlord Property ID: {id}</div>;
}
