import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import MagazinierCatalog from '../components/catalogs/MagazinierCatalog';
import DirecteurChefCatalog from '../components/catalogs/DirecteurChefCatalog';

const CataloguePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Layout>
      {user.role === 'magazinier' ? (
        <MagazinierCatalog />
      ) : (
        <DirecteurChefCatalog />
      )}
    </Layout>
  );
};

export default CataloguePage;