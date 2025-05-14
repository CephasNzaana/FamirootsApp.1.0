// src/pages/ClanDetails.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tribe, Clan } from '@/types';
import { PageContainer } from '@/components/PageContainer'; // Assuming this is a custom component
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import ClanFamilyTree from '@/components/ClanFamilyTree';
import { ugandaTribesData } from '@/data/ugandaTribesClanData';
import Header from '@/components/Header'; // Import Header
import Footer from '@/components/Footer'; // Import Footer (assuming it exists at this path)
import AuthForm from '@/components/AuthForm'; // For onLogin/onSignup functionality

const ClanDetails = () => {
  const { tribeId, clanId } = useParams<{ tribeId: string; clanId: string }>();
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [clan, setClan] = useState<Clan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState<boolean>(false); // For Header login/signup

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const foundTribe = ugandaTribesData.find(t => t.id === tribeId);
        
        if (foundTribe) {
          setTribe(foundTribe); 
          
          const foundClan = foundTribe.clans.find(c => c.id === clanId);
          if (foundClan) {
            setClan({
              ...foundClan,
              tribeName: foundTribe.name,
              tribeId: foundTribe.id,
            });
          } else {
            setClan(null);
          }
        } else {
          setTribe(null);
          setClan(null);
        }
      } catch (error) {
        console.error("Error loading clan data:", error);
        setTribe(null);
        setClan(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (tribeId && clanId) {
      window.scrollTo(0, 0); // Scroll to top on new data load
      loadData();
    } else {
      setLoading(false);
    }
  }, [tribeId, clanId]);

  const handleLogin = () => setShowAuth(true);
  const handleSignup = () => setShowAuth(true);

  if (loading) {
    return (
      <>
        <Header onLogin={handleLogin} onSignup={handleSignup} />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"> {/* Adjusted min-height */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uganda-yellow"></div>
          </div>
        </PageContainer>
        <Footer />
        {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  if (!clan) { // If clan is not found, tribe might also be null or less relevant for this error message
    return (
      <>
        <Header onLogin={handleLogin} onSignup={handleSignup} />
        <PageContainer>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2 text-uganda-black dark:text-white">Clan Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We couldn't find information about this clan ({clanId}) 
              {tribeId && ` within the selected tribe (${tribeId})`}. 
              It may not exist or has been removed.
            </p>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/cultural-resources" className="text-uganda-red hover:underline">Return to Cultural Resources</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </PageContainer>
        <Footer />
        {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
      </>
    );
  }
  
  // Tribe should be available if clan was found successfully.
  const currentTribe = tribe; 

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <PageContainer className="flex-grow py-8"> {/* Added padding to PageContainer */}
        <div className="mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/cultural-resources">Cultural Resources</Link></BreadcrumbLink>
              </BreadcrumbItem>
              {currentTribe && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link to={`/tribes/${currentTribe.id}`}>{currentTribe.name}</Link></BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{clan.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="space-y-8">
          <ClanFamilyTree clan={clan} />
        </div>
      </PageContainer>
      <Footer />
      {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default ClanDetails;
