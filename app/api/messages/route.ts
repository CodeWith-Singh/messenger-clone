import getCurrentUser from "@/app/action/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from '@/app/libs/prismadb'
import { connect } from "http2";
import { pusherServer } from "@/app/libs/pusher";
import { use } from "react";
import { gzip } from "zlib";

export async function POST(request: Request) {
    try {
        const currentuser = await getCurrentUser();
        const body = await request.json();
        const { message, image, conversationId } = body;
        if (!currentuser?.id || !currentuser.email) {
            return new NextResponse("Unautorized", { status: 401 })
        }

        const newMessage = await prisma.message.create({
            include: {
                seen: true,
                sender: true
            },
            data: {
                body: message,
                image: image,
                conversation: {
                    connect: {
                        id: conversationId
                    }
                },
                sender: {
                    connect: {
                        id: currentuser.id
                    }
                },
                seen: {
                    connect: {
                        id: currentuser.id
                    }
                },
            }
        });
        const updatedConversation = await prisma.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                lastMessageAt: new Date(),
                messages: {
                    connect: {
                        id: newMessage.id
                    }
                }
            },
            include: {
                users: true,
                messages: {
                    include: {
                        seen: true
                    }
                }
            }
        });

        await pusherServer.trigger(conversationId, 'messages:new',  newMessage);

        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

        updatedConversation.users.map((user) => {
            return pusherServer.trigger(user.email!, 'conversation:update', {
                id: conversationId,
                messages: [lastMessage]
            });
        });
        return NextResponse.json(newMessage)
    } catch (error) {
        console.log(error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}