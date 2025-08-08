import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * Placeholder client profile page. Displays the client id from the URL. This
 * page will later contain client details, rules & requirements, templates, etc.
 */
const ClientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h2 className="text-lg font-semibold">Client Profile</h2>
      <p>Viewing client with id: {id}</p>
      <p className="italic">Client profile placeholder</p>
    </div>
  );
};

export default ClientProfilePage;
