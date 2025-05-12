
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tribe, Clan } from '@/types';
import { PageContainer } from '@/components/PageContainer';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import ClanFamilyTree from '@/components/ClanFamilyTree';
import { ugandaTribesData } from '@/data/ugandaTribesClanData';

const ClanDetails = () => {
  const { tribeId, clanId } = useParams();
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [clan, setClan] = useState<Clan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a production app, this would be a database call
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Find the tribe in our data
        const foundTribe = ugandaTribesData.find(t => t.id === tribeId);
        
        if (foundTribe) {
          setTribe(foundTribe as unknown as Tribe);
          
          // Find the clan within the tribe
          const foundClan = foundTribe.clans.find(c => c.id === clanId);
          if (foundClan) {
            setClan({
              ...foundClan,
              tribeName: foundTribe.name,
              tribeId: foundTribe.id
            } as unknown as Clan);
          }
        }
      } catch (error) {
        console.error("Error loading clan data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tribeId, clanId]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uganda-yellow"></div>
        </div>
      </PageContainer>
    );
  }

  if (!tribe || !clan) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Clan Not Found</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find information about this clan. It may not exist or has been removed.
          </p>
          <BreadcrumbLink href="/cultural-resources">Return to Cultural Resources</BreadcrumbLink>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/cultural-resources">Cultural Resources</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/tribes/${tribe.id}`}>{tribe.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="">{clan.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div className="space-y-8">
        <ClanFamilyTree clan={clan} />
      </div>
    </PageContainer>
  );
};

export default ClanDetails;
