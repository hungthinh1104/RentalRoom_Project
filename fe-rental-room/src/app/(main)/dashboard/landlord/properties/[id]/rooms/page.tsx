import React from 'react';

export default function PropertyRoomsPage({ params }: { params: { id: string } }) {
	return <div className="container py-6">Rooms for Property ID: {params.id}</div>;
}
