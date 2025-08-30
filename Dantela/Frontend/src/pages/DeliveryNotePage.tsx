// src/pages/DeliveryNotePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

interface BonItem {
  id: string;
  code_produit: string;
  materiau_nom: string;
  quantite_demandee: number;
  unite: string;
}
interface BonLivraison {
  id: string;
  numero_bon: string;
  date_preparation: string;
  demandeur_nom: string;
  demandeur_email: string;
  demandeur_telephone: string;
  demandeur_adresse: string;
  nom_chantier: string;
  magazinier_nom: string;
  depot_nom: string;
  items: BonItem[];
}

const DeliveryNotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bonLivraison, setBonLivraison] = useState<BonLivraison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDate = (iso?: string) => {
    try {
      const d = iso ? new Date(iso) : new Date();
      return d.toLocaleDateString('fr-FR');
    } catch {
      return '--/--/----';
    }
  };
  const formatTime = (iso?: string) => {
    try {
      const d = iso ? new Date(iso) : new Date();
      return d.toLocaleTimeString('fr-FR');
    } catch {
      return '--:--:--';
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      if (id.startsWith('direct-')) {
        const directBonId = id.replace('direct-', '');
        await createDirectBonData(directBonId);
      } else {
        await fetchBonLivraison();
      }
    };
    run();
  }, [id]);

  const createDirectBonData = async (bonId: string) => {
    try {
      setLoading(true);
      setError('');
      const bonDataString = localStorage.getItem(`bon_direct_${bonId}`);
      if (bonDataString) {
        const bonData = JSON.parse(bonDataString);
        setBonLivraison(bonData);
      } else {
        await fetchBonFromAPI(bonId);
      }
    } catch (e) {
      console.error(e);
      setError('Erreur lors du chargement du bon.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBonFromAPI = async (bonId: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API}/bons-livraison/${bonId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const bonData = data.bon_livraison ?? {};

        let destinataireNom = 'Distribution Directe';
        let destinataireEmail = 'distribution@dantela.cm';
        let destinataireTelephone = '+237669790437';
        let destinataireAdresse = "203 Boulevard de l'OCAM, Mvog Mbi - Yaoundé";

        if (bonData.destinataire_custom) {
          const customData =
            typeof bonData.destinataire_custom === 'string'
              ? JSON.parse(bonData.destinataire_custom)
              : bonData.destinataire_custom;
          destinataireNom = customData?.nom || destinataireNom;
          destinataireEmail = 'externe@dantela.cm';
          destinataireTelephone = customData?.telephone || destinataireTelephone;
          destinataireAdresse = customData?.adresse || destinataireAdresse;
        } else if (bonData.destinataire_nom) {
          destinataireNom = bonData.destinataire_nom;
          destinataireEmail = bonData.destinataire_email || 'chef@dantela.cm';
          destinataireTelephone = bonData.destinataire_telephone || '+237669790437';
          destinataireAdresse = bonData.destinataire_adresse || 'Adresse du chantier';
        }

        const bon: BonLivraison = {
          id: bonData.id ?? bonId,
          numero_bon: bonData.numero_bon ?? `BL-${new Date().getFullYear()}-0573`,
          date_preparation: bonData.date_preparation || new Date().toISOString(),
          demandeur_nom: destinataireNom,
          demandeur_email: destinataireEmail,
          demandeur_telephone: destinataireTelephone,
          demandeur_adresse: destinataireAdresse,
          nom_chantier: bonData.nom_chantier || 'Distribution Directe',
          magazinier_nom:
            bonData.magazinier_nom ||
            `${user?.prenom || ''} ${user?.nom || ''}`.trim() ||
            'Magazinier Dantela',
          depot_nom: bonData.depot_nom || 'Dépôt Principal Yaoundé',
          items: bonData.items || [],
        };

        setBonLivraison(bon);
      } else {
        setBonLivraison({
          id: bonId,
          numero_bon: `BL-${new Date().getFullYear()}-0573`,
          date_preparation: new Date().toISOString(),
          demandeur_nom: 'Distribution Directe',
          demandeur_email: 'distribution@dantela.cm',
          demandeur_telephone: '+237669790437',
          demandeur_adresse: "203 Boulevard de l'OCAM, Mvog Mbi - Yaoundé",
          nom_chantier: 'Distribution Directe',
          magazinier_nom:
            `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Magazinier Dantela',
          depot_nom: 'Dépôt Principal Yaoundé',
          items: [],
        });
      }
    } catch (error) {
      console.error('❌ Erreur API bon de livraison:', error);
      setBonLivraison({
        id: bonId,
        numero_bon: `BL-${new Date().getFullYear()}-0573`,
        date_preparation: new Date().toISOString(),
        demandeur_nom: 'Distribution Directe',
        demandeur_email: 'distribution@dantela.cm',
        demandeur_telephone: '+237669790437',
        demandeur_adresse: "203 Boulevard de l'OCAM, Mvog Mbi - Yaoundé",
        nom_chantier: 'Distribution Directe',
        magazinier_nom:
          `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Magazinier Dantela',
        depot_nom: 'Dépôt Principal Yaoundé',
        items: [],
      });
    }
  };

  const fetchBonLivraison = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token') || '';

      const response = await fetch(`${API}/demandes/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setError(`Erreur HTTP: ${response.status}`);
        return;
      }

      const data = await response.json();
      const demande = data.demande || {};

      const destinataireNom =
        demande.demandeur_nom || demande.destinataire_nom || 'Non spécifié';
      const destinataireEmail =
        demande.demandeur_email || demande.destinataire_email || 'non.specifie@exemple.com';
      const destinataireTelephone =
        demande.demandeur_telephone || demande.destinataire_telephone || '—';
      const destinataireAdresse =
        demande.demandeur_adresse || demande.destinataire_adresse || '—';

      const bon: BonLivraison = {
        id: demande.id,
        numero_bon: demande.numero_bon ?? `BL-${new Date().getFullYear()}-0573`,
        date_preparation: demande.date_preparation ?? new Date().toISOString(),
        demandeur_nom: destinataireNom,
        demandeur_email: destinataireEmail,
        demandeur_telephone: destinataireTelephone,
        demandeur_adresse: destinataireAdresse,
        nom_chantier: demande.nom_chantier || 'Non spécifié',
        magazinier_nom:
        `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Non spécifié',
        depot_nom: demande.depot_nom || 'Dépôt Principal',
        items: demande.items || [],
      };

      setBonLivraison(bon);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const safeString = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'Non spécifié';
    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !bonLivraison) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error || 'Données indisponibles'}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Barre d’actions (hors impression) */}
      <div className="no-print bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Printer className="w-5 h-5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Télécharger PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document A4 */}
      <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
        <div className="delivery-document">
          {/* EN-TÊTE */}
          <div className="document-header">
            <div className="header-top">
              <div className="logo-section">
                <div className="logo-container">
  <img
    src="/dantela.png"
    alt="DANTELA"
    className="logo-img"
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).style.display = 'none';
      const pdf = document.getElementById('logo-pdf');
      if (pdf) pdf.classList.remove('hidden');
    }}
  />
  <object
    id="logo-pdf"
    data="/dantela.pdf#page=1&view=Fit"
    type="application/pdf"
    className="logo-embed hidden"
    aria-label="Logo DANTELA PDF"
  />
</div>


                <div className="company-info">
                  <h1 className="company-name">DANTELA</h1>
                  <p className="company-tagline">&quot;La Marque de la Construction&quot;</p>
                </div>
              </div>

              <div className="contact-info">
                <p>Tél: +237 669 790 437</p>
                <p>www.dantela.cm</p>
                <p>203 Bd de l&apos;OCAM, Mvog Mbi</p>
                <p>Yaoundé, Cameroun</p>
              </div>
            </div>

            <div className="main-title-section">
              <h2 className="main-title">BON DE LIVRAISON</h2>
              <div className="title-underline" />
            </div>
          </div>

          {/* CONTENU */}
          <div className="document-content">
            <div className="info-sections">
              <div className="client-section">
                <h3 className="section-title">INFORMATIONS CLIENT</h3>
                <div className="client-details">
                  <div className="detail-row">
                    <span className="label">Nom:</span>
                    <span className="value">{safeString(bonLivraison.demandeur_nom)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Téléphone:</span>
                    <span className="value">{safeString(bonLivraison.demandeur_telephone)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Adresse:</span>
                    <span className="value">{safeString(bonLivraison.demandeur_adresse)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Chantier:</span>
                    <span className="value">{safeString(bonLivraison.nom_chantier)}</span>
                  </div>
                </div>
              </div>

              <div className="bon-details-section">
                <h3 className="section-title">DÉTAILS DU BON</h3>
                <div className="bon-details">
                  <div className="detail-row">
                    <span className="label">Numéro Bon:</span>
                    <span className="value">{safeString(bonLivraison.numero_bon)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(bonLivraison.date_preparation)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Heure:</span>
                    <span className="value">{formatTime(bonLivraison.date_preparation)}</span>
                  </div>
                </div>

                <div className="treated-by">
                  <h4 className="subsection-title">TRAITÉ PAR</h4>
                  <div className="detail-row">
                    <span className="label">Magazinier:</span>
                    <span className="value">{safeString(bonLivraison.magazinier_nom)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Dépôt:</span>
                    <span className="value">{safeString(bonLivraison.depot_nom)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="materials-section">
              <table className="materials-table">
                <thead>
                  <tr className="table-header">
                    <th className="col-number">N°</th>
                    <th className="col-product">Nom du produit</th>
                    <th className="col-quantity">Quantité</th>
                    <th className="col-unit">Unité</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {Array.from({ length: 15 }, (_, index) => {
                    const item = bonLivraison.items[index];
                    return (
                      <tr key={index} className="table-row">
                        <td className="cell-number">{item ? index + 1 : ''}</td>
                        <td className="cell-product">{item ? item.materiau_nom : ''}</td>
                        <td className="cell-quantity">{item ? item.quantite_demandee : ''}</td>
                        <td className="cell-unit">{item ? item.unite : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIGNATURES */}
          <div className="signatures-section">
            <div className="signature-row">
              <div className="signature-box">
                <p className="signature-label">Signature Magazinier:</p>
                <div className="signature-line" />
                <p className="signature-date">Date: ___________</p>
              </div>
              <div className="signature-box">
                <p className="signature-label">Signature Récipiendaire:</p>
                <div className="signature-line" />
                <p className="signature-date">Date: ___________</p>
              </div>
              <div className="signature-box">
                <p className="signature-label">Signature Chef de Chantier:</p>
                <div className="signature-line" />
                <p className="signature-date">Date: ___________</p>
              </div>
            </div>
          </div>

          {/* PIED DE PAGE */}
          <div className="document-footer">
            <div className="footer-content">
              <p className="footer-address">
                203, Boulevard de l&apos;OCAM, Rue 4.017, B.P:156263 Mvog-Mbi / Yaoundé - CAMEROUN
              </p>
              <p className="footer-contact">
                Site Internet : www.dantela.com &nbsp;|&nbsp; Téléphone: 669790437 &nbsp;|&nbsp;
                E-mail: info@dantela.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        /* --- Document A4 fixe --- */
        .delivery-document {
          width: 210mm; height: 297mm;
          margin: 0 auto; background: #fff;
          position: relative; font-family: Arial, sans-serif;
          font-size: 12px; color: #000; padding: 0;
          box-sizing: border-box; overflow: hidden;
        }

        /* --- Header --- */
        .document-header {
          position: absolute; top: 0; left: 0; right: 0;
          height: 80mm; padding: 15mm 15mm 0 15mm;
          background: #fff; z-index: 10;
        }
        .header-top {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 15mm;
        }
        .logo-section { display: flex; align-items: center; gap: 10mm; }

        /* Logo container + PDF embed / PNG fallback */
        .logo-container { width: 25mm; height: 15mm; display: flex; align-items: center; justify-content: center; background: transparent; }
        .logo-embed, .logo-img { width: 100%; height: 100%; object-fit: contain; }
        .logo-embed { pointer-events: none; }

        .company-info { margin-left: 5mm; }
        .company-name { font-size: 24px; font-weight: bold; color: #1a365d; margin: 0; letter-spacing: 2px; }
        .company-tagline { font-size: 10px; color: #666; margin: 2px 0 0 0; font-style: italic; }

        .contact-info { text-align: right; font-size: 9px; color: #333; line-height: 1.3; }
        .contact-info p { margin: 1px 0; }

        .main-title-section { text-align: center; margin-top: 10mm; }
        .main-title { font-size: 18px; font-weight: bold; color: #1a365d; margin: 0; letter-spacing: 1px; }
        .title-underline { width: 120mm; height: 2px; background: #1a365d; margin: 5mm auto 0; }

        /* --- Contenu --- */
        .document-content { position: absolute; top: 80mm; left: 15mm; right: 15mm; bottom: 60mm; overflow: hidden; }
        .info-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; margin-bottom: 8mm; }
        .client-section, .bon-details-section { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 3mm; padding: 5mm; }
        .section-title { font-size: 11px; font-weight: bold; color: #1a365d; margin: 0 0 3mm 0; text-transform: uppercase; letter-spacing: .5px; }
        .subsection-title { font-size: 9px; font-weight: bold; color: #1a365d; margin: 3mm 0 2mm 0; text-transform: uppercase; }
        .client-details, .bon-details { font-size: 9px; }
        .detail-row { display: flex; margin-bottom: 1.5mm; }
        .label { font-weight: 600; color: #333; min-width: 25mm; }
        .value { color: #000; flex: 1; }

        /* --- Tableau --- */
        .materials-section { margin-top: 5mm; }
        .materials-table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
        .table-header { background: #20b2aa; color: #fff; }
        .table-header th { padding: 3mm 2mm; text-align: center; font-weight: bold; font-size: 11px; border: 1px solid #000; }
        .col-number { width: 15mm; } .col-quantity { width: 20mm; } .col-unit { width: 20mm; }
        .table-body { background: #f5f5f5; }
        .table-row { height: 8mm; border-bottom: 1px solid #ccc; }
        .table-row td { padding: 1mm 2mm; border-right: 1px solid #ccc; font-size: 9px; vertical-align: middle; }
        .cell-number, .cell-quantity, .cell-unit { text-align: center; }
        .cell-number, .cell-quantity { font-weight: bold; }

        /* --- Signatures --- */
        .signatures-section { position: absolute; bottom: 25mm; left: 15mm; right: 15mm; height: 20mm; }
        .signature-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10mm; height: 100%; }
        .signature-box { text-align: center; }
        .signature-label { font-size: 9px; font-weight: 600; color: #333; margin: 0 0 3mm 0; }
        .signature-line { border-bottom: 1px solid #000; height: 10mm; margin-bottom: 2mm; }
        .signature-date { font-size: 8px; color: #666; margin: 0; }

        /* --- Footer --- */
        .document-footer { position: absolute; bottom: 0; left: 0; right: 0; height: 25mm; background: #f8f9fa; border-top: 2px solid #1a365d; display: flex; align-items: center; justify-content: center; padding: 0 15mm; }
        .footer-content { text-align: center; }
        .footer-address { font-size: 9px; font-weight: 600; color: #333; margin: 0 0 1mm 0; }
        .footer-contact { font-size: 8px; color: #666; margin: 0; }

        /* --- Impression --- */
        @media print {
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .delivery-document { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; position: relative !important; page-break-after: avoid !important; page-break-inside: avoid !important; overflow: hidden !important; background: #fff !important; box-shadow: none !important; border: none !important; }
          .document-header { position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; height: 80mm !important; padding: 15mm 15mm 0 15mm !important; background: #fff !important; page-break-inside: avoid !important; }
          .company-name { color: #1a365d !important; font-size: 24px !important; }
          .main-title { color: #1a365d !important; font-size: 18px !important; }
          .title-underline { background: #1a365d !important; }
          .document-content { position: absolute !important; top: 80mm !important; left: 15mm !important; right: 15mm !important; bottom: 60mm !important; overflow: hidden !important; page-break-inside: avoid !important; }
          .client-section, .bon-details-section { background: #f8f9fa !important; border: 1px solid #dee2e6 !important; }
          .section-title, .subsection-title { color: #1a365d !important; }
          .table-header th { background: #20b2aa !important; color: #fff !important; border: 1px solid #000 !important; }
          .table-body { background: #f5f5f5 !important; }
          .table-row td { border-right: 1px solid #ccc !important; border-bottom: 1px solid #ccc !important; }
          .signatures-section { position: absolute !important; bottom: 25mm !important; left: 15mm !important; right: 15mm !important; height: 20mm !important; page-break-inside: avoid !important; }
          .signature-line { border-bottom: 1px solid #000 !important; }
          .document-footer { position: absolute !important; bottom: 0 !important; left: 0 !important; right: 0 !important; height: 25mm !important; background: #f8f9fa !important; border-top: 2px solid #1a365d !important; page-break-inside: avoid !important; }

          /* Forcer une seule page */
          @page { size: A4; margin: 0; }
          html, body, .min-h-screen { height: 297mm !important; overflow: hidden !important; }

          /* Si le PDF du logo ne s'imprime pas, force l'image PNG */
          .logo-embed { display: none !important; }
          .logo-img { display: block !important; }
        }

        /* --- Écran --- */
        @media screen {
          .delivery-document {
            box-shadow: 0 4px 6px -1px rgba(0,0,0,.1);
            border: 1px solid #e5e7eb;
            margin: 20px auto;
          }
        }
      `}</style>
    </>
  );
};

export default DeliveryNotePage;
