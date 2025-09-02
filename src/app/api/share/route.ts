import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '~/server/services/storage';
import { ShareRequestSchema } from '~/types/share';
import type { SharedResponse } from '~/types/share';

const storageService = new StorageService();

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await req.json();
    
    // Validate the request body
    const validatedData = ShareRequestSchema.parse(body);
    
    // Create the shared response with generated metadata
    const sharedResponse: SharedResponse = {
      ...validatedData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    // Upload to Google Cloud Storage
    const publicUrl = await storageService.uploadSharedResponse(sharedResponse);

    return NextResponse.json({
      success: true,
      id: sharedResponse.id,
      url: publicUrl,
      shareUrl: `${req.nextUrl.origin}/shared/${sharedResponse.id}`,
    });
  } catch (error) {
    console.error('Share API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: error.name === 'ZodError' ? 'Invalid data format' : 'Upload failed'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const sharedResponse = await storageService.getSharedResponse(id);

    if (!sharedResponse) {
      return NextResponse.json(
        { error: 'Shared response not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sharedResponse);
  } catch (error) {
    console.error('Share GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared response' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const success = await storageService.deleteSharedResponse(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete shared response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share DELETE API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete shared response' },
      { status: 500 }
    );
  }
}
