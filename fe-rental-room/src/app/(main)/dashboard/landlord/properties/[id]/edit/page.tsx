import React from 'react';

export default function EditLandlordPropertyPage({ params }: { params: { id: string } }) {
	return <div className="container py-6">Edit Landlord Property ID: {params.id}</div>;
}
