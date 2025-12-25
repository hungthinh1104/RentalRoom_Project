import React from 'react';

export default function LandlordPropertyPage({ params }: { params: { id: string } }) {
	return <div className="container py-6">Landlord Property ID: {params.id}</div>;
}
