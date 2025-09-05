import Link from "next/link";
import { Header } from "~/app/_components/Header";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Header />
        
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">About AI Ensemble</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              AI Ensemble combines the power of multiple AI models to provide more reliable, 
              comprehensive, and accurate responses through intelligent comparison and consensus building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-3 text-[hsl(280,100%,70%)]">Comparison</h3>
              <p className="text-gray-300">
                Compare responses from multiple AI models side-by-side to see different perspectives 
                and approaches to your questions.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-[hsl(280,100%,70%)]">Consensus</h3>
              <p className="text-gray-300">
                Generate a unified consensus response that synthesizes the best insights from 
                all participating models.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-[hsl(280,100%,70%)]">Synthesis</h3>
              <p className="text-gray-300">
                Create comprehensive, well-rounded answers by combining the strengths of 
                different AI models and approaches.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-6 text-center">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[hsl(280,100%,70%)] rounded-full flex items-center justify-center text-sm font-bold text-white">1</div>
                  <div>
                    <h4 className="font-semibold">Multi-Provider Support</h4>
                    <p className="text-gray-400 text-sm">OpenAI, Google, Anthropic, and Grok integration</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[hsl(280,100%,70%)] rounded-full flex items-center justify-center text-sm font-bold text-white">2</div>
                  <div>
                    <h4 className="font-semibold">Real-time Streaming</h4>
                    <p className="text-gray-400 text-sm">Watch responses generate in real-time</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[hsl(280,100%,70%)] rounded-full flex items-center justify-center text-sm font-bold text-white">3</div>
                  <div>
                    <h4 className="font-semibold">Agreement Analysis</h4>
                    <p className="text-gray-400 text-sm">Visual analysis of how well models agree</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[hsl(280,100%,70%)] rounded-full flex items-center justify-center text-sm font-bold text-white">4</div>
                  <div>
                    <h4 className="font-semibold">Manual Response Addition</h4>
                    <p className="text-gray-400 text-sm">Add responses from any AI model manually</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[hsl(280,100%,70%)] rounded-full flex items-center justify-center text-sm font-bold text-white">5</div>
                  <div>
                    <h4 className="font-semibold">Smart Consensus</h4>
                    <p className="text-gray-400 text-sm">AI-powered synthesis of multiple responses</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[hsl(280,100%,70%)] rounded-full flex items-center justify-center text-sm font-bold text-white">6</div>
                  <div>
                    <h4 className="font-semibold">Easy Sharing</h4>
                    <p className="text-gray-400 text-sm">Share results with colleagues and friends</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[hsl(280,100%,70%)] rounded-full flex items-center justify-center text-sm font-bold text-white">7</div>
                  <div>
                    <h4 className="font-semibold">Copy & Export</h4>
                    <p className="text-gray-400 text-sm">Copy individual responses or full results</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[hsl(280,100%,70%)] rounded-full flex items-center justify-center text-sm font-bold text-white">8</div>
                  <div>
                    <h4 className="font-semibold">Persistent Settings</h4>
                    <p className="text-gray-400 text-sm">Your configurations are saved automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link 
              href="/" 
              className="inline-block bg-[hsl(280,100%,70%)] text-white font-bold py-3 px-8 rounded-lg hover:bg-[hsl(280,100%,60%)] transition-colors"
            >
              Try AI Ensemble
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
