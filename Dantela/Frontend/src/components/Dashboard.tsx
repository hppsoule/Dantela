import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import DirecteurDashboard from './dashboards/DirecteurDashboard';
import MagazinierDashboard from './dashboards/MagazinierDashboard';
import ChefChantierDashboard from './dashboards/ChefChantierDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const renderDashboard = () => {
  switch (user.role) {
    case 'directeur':
      return <DirecteurDashboard />;
    case 'magazinier':
      return <MagazinierDashboard />;
    case 'chef_chantier':
      return <ChefChantierDashboard />;
    default:
      return <div>Rôle non reconnu</div>;
  }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

export default Dashboard;