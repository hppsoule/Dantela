import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Truck, 
  Users, 
  Award,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [, forceUpdate] = useState({});

  // Écouter les changements de langue
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const services = [
    {
      icon: Building2,
      title: language === 'fr' ? 'Construction BTP' : t('home.services.construction.title'),
      description: language === 'fr' ? 'Expertise turque au service du développement du Cameroun. Spécialisés en construction BTP, béton prêt à l\'emploi et commerce de matériaux depuis 2015.' : t('home.services.construction.description'),
      features: language === 'fr' ? ['Génie civil', 'Architecture', 'Ingénierie', 'Urbanisation'] : [t('home.services.construction.feature1'), t('home.services.construction.feature2'), t('home.services.construction.feature3'), t('home.services.construction.feature4')]
    },
    {
      icon: Truck,
      title: language === 'fr' ? 'Commerce Général' : t('home.services.commerce.title'),
      description: language === 'fr' ? 'Distribution et commerce de matériaux de construction de haute qualité pour tous vos projets.' : t('home.services.commerce.description'),
      features: language === 'fr' ? ['Matériaux de construction', 'Équipements BTP', 'Livraison rapide', 'Stock permanent'] : [t('home.services.commerce.feature1'), t('home.services.commerce.feature2'), t('home.services.commerce.feature3'), t('home.services.commerce.feature4')]
    },
    {
      icon: Award,
      title: language === 'fr' ? 'Production Béton' : t('home.services.concrete.title'),
      description: language === 'fr' ? 'Production de béton prêt à l\'emploi avec les meilleures techniques turques adaptées au marché camerounais.' : t('home.services.concrete.description'),
      features: language === 'fr' ? ['Béton haute qualité', 'Livraison sur site', 'Contrôle qualité', 'Formulations spéciales'] : [t('home.services.concrete.feature1'), t('home.services.concrete.feature2'), t('home.services.concrete.feature3'), t('home.services.concrete.feature4')]
    }
  ];

  const stats = [
    { number: '2015', label: language === 'fr' ? 'Années d\'expérience' : t('home.stats.experience') },
    { number: '100+', label: language === 'fr' ? 'Projets réalisés' : t('home.stats.projects') },
    { number: '50+', label: language === 'fr' ? 'Employés formés' : t('home.stats.employees') },
    { number: '24/7', label: language === 'fr' ? 'Service client' : t('home.stats.service') }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                DANTELA
              </h1>
              <h2 className="text-2xl lg:text-3xl text-blue-300 mb-6">
                Construction & Commerce
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {language === 'fr' ? 'Expertise turque au service du développement du Cameroun. Spécialisés en construction BTP, béton prêt à l\'emploi et commerce de matériaux depuis 2015.' : t('home.hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-green-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>{language === 'fr' ? 'Rejoindre Dantela' : t('home.hero.join')}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/services"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-slate-900 transition-all duration-200"
                >
                  {language === 'fr' ? 'Nos Services' : t('home.hero.services')}
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1166643/pexels-photo-1166643.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Construction moderne Dantela"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white text-slate-900 p-6 rounded-xl shadow-xl">
                <p className="text-2xl font-bold text-blue-600">2015</p>
                <p className="text-sm font-medium">{language === 'fr' ? 'Années d\'expérience' : t('home.stats.experience')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {language === 'fr' ? 'Nos Activités & Prestations' : t('home.services.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {language === 'fr' ? 'Dantela offre une gamme complète de services dans le domaine de la construction et du commerce, alliant expertise turque et savoir-faire local.' : t('home.services.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {language === 'fr' ? 'À Propos de Dantela' : t('home.about.title')}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {language === 'fr' ? 'Dantela est une société de construction et de commerce basée au Cameroun. Créée le 30 Novembre 2015 à Yaoundé par des hommes d\'affaires turcs, nous avons choisi d\'investir au Cameroun pour sa stabilité et sa sécurité.' : t('home.about.description1')}
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {language === 'fr' ? 'Notre mission est de transférer les connaissances et expériences turques dans le domaine du génie civil au Cameroun, tout en contribuant à la formation de notre personnel camerounais aux meilleures techniques.' : t('home.about.description2')}
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 font-medium">{language === 'fr' ? 'Transfert de connaissances turques' : t('home.about.feature1')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 font-medium">{language === 'fr' ? 'Formation du personnel camerounais' : t('home.about.feature2')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 font-medium">{language === 'fr' ? 'Contribution à l\'urbanisation du Cameroun' : t('home.about.feature3')}</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Équipe Dantela"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -top-6 -right-6 bg-blue-600 text-white p-6 rounded-xl shadow-xl">
                <p className="text-lg font-bold">RC/YAO/2015/B/960</p>
                <p className="text-sm opacity-90">Registre de commerce</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            {language === 'fr' ? 'Prêt à rejoindre l\'équipe Dantela ?' : t('home.cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {language === 'fr' ? 'Que vous soyez magazinier ou chef de chantier, rejoignez notre système de gestion moderne pour optimiser vos opérations.' : t('home.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {language === 'fr' ? 'Créer un compte' : t('home.cta.create')}
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              {language === 'fr' ? 'Se connecter' : t('home.cta.login')}
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Téléphone</h3>
              <p className="text-gray-300">+237 669 790 437</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <p className="text-gray-300">contact@dantela.cm</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Adresse</h3>
              <p className="text-gray-300">203 Bd de l'OCAM, Mvog Mbi - Yaoundé</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;