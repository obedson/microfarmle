import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Shield, Users, BookOpen, TrendingUp } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Home: React.FC = () => {
  const features = [
    {
      icon: Search,
      title: 'Easy Discovery',
      description: 'Find the perfect livestock farming space with our advanced search and filtering system.'
    },
    {
      icon: MapPin,
      title: 'Location-Based',
      description: 'Discover properties near you or in your preferred farming regions across the country.'
    },
    {
      icon: Shield,
      title: 'Secure Booking',
      description: 'Safe and secure booking process with verified property owners and transparent pricing.'
    },
    {
      icon: BookOpen,
      title: 'Learning Platform',
      description: 'Access agricultural courses, best practices, and career development resources.'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Track your farming progress and build your agricultural career with expert guidance.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Join a community of livestock farmers and property owners working together.'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Your Agricultural
            <span className="text-primary-600 block">Learning And Investment Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-balance">
            Connect with property owners, discover ideal farming spaces, and advance your agricultural career 
            through our comprehensive learning platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/properties">
              <Button size="lg" className="w-full sm:w-auto">
                <Search size={20} />
                Browse Properties
              </Button>
            </Link>
            <Link to="/courses">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Start Learning
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Micro Farmle?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We combine property rental with agricultural education, and earning to accelerate your farming career.
          </p>
        </div>
        
        <div className="grid-responsive">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon size={24} className="text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 rounded-2xl p-8 md:p-12 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Invest in Your Agricultural Career?
        </h2>
        <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Join thousands of farmers and property owners who trust Micro Farmle for their livestock space needs and agricultural career development.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Create Account
            </Button>
          </Link>
          <Link to="/properties">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600">
              View Properties
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
