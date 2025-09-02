import { notFound } from 'next/navigation';
import { StorageService } from '~/server/services/storage';
import { SharedResponseViewer } from '~/app/_components/SharedResponseViewer';

interface SharedPageProps {
  params: {
    id: string;
  };
}

export default async function SharedPage({ params }: SharedPageProps) {
  const storageService = new StorageService();
  
  try {
    const sharedResponse = await storageService.getSharedResponse(params.id);
    
    if (!sharedResponse) {
      notFound();
    }

    return (
      <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-4 md:p-8">
        <div className="w-full max-w-5xl">
          <SharedResponseViewer data={sharedResponse} />
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading shared response:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: SharedPageProps) {
  const storageService = new StorageService();
  
  try {
    const sharedResponse = await storageService.getSharedResponse(params.id);
    
    if (!sharedResponse) {
      return {
        title: 'Shared Response Not Found | AI Ensemble',
        description: 'The shared AI ensemble response you\'re looking for could not be found.',
      };
    }

    const promptPreview = sharedResponse.prompt.length > 100 
      ? `${sharedResponse.prompt.substring(0, 100)}...`
      : sharedResponse.prompt;

    return {
      title: `Shared AI Ensemble Response | AI Ensemble`,
      description: `View this shared AI ensemble response: "${promptPreview}" - Compare responses from multiple AI models.`,
      openGraph: {
        title: 'AI Ensemble - Shared Response',
        description: `"${promptPreview}" - AI ensemble analysis with consensus from multiple models.`,
        type: 'article',
        publishedTime: sharedResponse.timestamp,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'AI Ensemble - Shared Response',
        description: `"${promptPreview}" - Compare responses from multiple AI models.`,
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Shared Response | AI Ensemble',
      description: 'View shared AI ensemble responses comparing multiple AI models.',
    };
  }
}
