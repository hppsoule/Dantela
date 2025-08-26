export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  adresse?: string;
  role: 'directeur' | 'magazinier' | 'chef_chantier';
  nom_chantier?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Depot {
  id: string;
  nom: string;
  adresse: string;
  description?: string;
  directeur_nom?: string;
  directeur_prenom?: string;
  magazinier_nom?: string;
  magazinier_prenom?: string;
  magazinier_email?: string;
  is_active: boolean;
  created_at: string;
}

export interface PendingUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: 'magazinier' | 'chef_chantier';
  nom_chantier?: string;
  created_at: string;
}

export interface Categorie {
  id: string;
  nom: string;
  description?: string;
  depot_id: string;
  created_at: string;
}

export interface Materiel {
  id: string;
  nom: string;
  description?: string;
  unite: string;
  prix_unitaire: number;
  stock_actuel: number;
  stock_minimum: number;
  categorie_id: string;
  depot_id: string;
  created_at: string;
  updated_at: string;
}

export interface DemandeMateriaux {
  id: string;
  demandeur_id: string;
  demandeur_nom?: string;
  demandeur_role?: string;
  demandeur_email?: string;
  depot_id: string;
  depot_nom?: string;
  statut: 'en_attente' | 'approuvee' | 'rejetee' | 'livree';
  priorite?: 'basse' | 'normale' | 'haute' | 'urgente';
  date_demande: string;
  date_livraison_prevue?: string;
  date_livraison_souhaitee?: string;
  commentaire?: string;
  commentaire_demandeur?: string;
  commentaire_magazinier?: string;
  validee_par?: string;
  valideur_nom?: string;
  date_validation?: string;
  numero_demande: string;
  nombre_items?: number;
  total_quantite_demandee?: number;
  total_quantite_accordee?: number;
  created_at: string;
  updated_at: string;
  items?: DemandeItem[];
}

export interface DemandeItem {
  id: string;
  demande_id: string;
  materiel_id: string;
  quantite_demandee: number;
  quantite_accordee?: number;
  created_at: string;
}

export interface BonLivraison {
  id: string;
  demande_id: string;
  numero_bon: string;
  magazinier_id: string;
  chef_chantier_id: string;
  date_livraison: string;
  statut: 'en_preparation' | 'livre' | 'annule';
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
}