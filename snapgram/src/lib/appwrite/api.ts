import { ID, Query } from "appwrite";

import { account, appwriteConfig, avatars, databases, storage } from "./config";
import { INewPost, INewUser, IUpdatePost } from "@/types";

// ============
//     Auth
// ============
export async function createUserAccount(user: INewUser) {
    try {
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name,
        )

        if (!newAccount) throw Error

        const avatarUrl = avatars.getInitials(user.name)

        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            email: newAccount.email,
            name: newAccount.name,
            username: user.username,
            imageUrl: avatarUrl
        })

        return newUser
    } catch (error) {
        console.error(error);
    }
}

export async function saveUserToDB(user: {
    accountId: string
    email: string
    name: string
    username?: string
    imageUrl: URL
}) {
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            ID.unique(),
            user,
        )

        return newUser
    } catch (error) {
        console.error(error);
    }
}

export async function signInAccount(user: {
    email: string
    password: string
}) {
    try {
        const session = await account.createEmailSession(user.email, user.password)

        return session
    } catch (error) {
        console.error(error);
    }

}

export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current")

        return session
    } catch (error) {
        console.error(error);
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get()

        if (!currentAccount) throw Error

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            [Query.equal('accountId', currentAccount.$id)]
        )

        if (!currentUser) throw Error

        return currentUser.documents[0]
    } catch (error) {
        console.error(error);
        return null
    }
}

// ============
//     Posts
// ============
export async function createPost(post: INewPost) {
    try {
        const uploadedFile = await uploadFile(post.file[0])

        if (!uploadedFile) throw Error

        const fileUrl = getFilePreview(uploadedFile.$id)

        if (!fileUrl) {
            await deleteFile(uploadedFile.$id)
            throw Error
        }

        const tags = post.tags?.replace(/ /g, "").split(",") || []

        const newPost = await databases.createDocument(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags
            }
        )

        if (!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error
        }

        return newPost
    } catch (error) {
        console.error(error);
    }
}

export async function uploadFile(file: File) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageID,
            ID.unique(),
            file
        );

        return uploadedFile;
    } catch (error) {
        console.log(error);
    }
}

export function getFilePreview(fileId: string) {
    try {
        const fileUrl = storage.getFilePreview(
            appwriteConfig.storageID,
            fileId,
            2000, // width
            2000, // height
            'top', // mode
            100, // quality
        )

        if (!fileUrl) throw Error

        return fileUrl
    } catch (error) {
        console.log(error);
    }
}

export async function deleteFile(fileId: string) {
    try {
        await storage.deleteFile(appwriteConfig.storageID, fileId);

        return { status: 'ok' }
    } catch (error) {
        console.error(error);
    }
}

export async function getRecentPosts() {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            [Query.orderDesc('$createdAt'), Query.limit(20)],
        )

        if (!posts) throw Error

        return posts
    } catch (error) {
        console.error(error);
    }
}

export async function likePost(postId: string, likesArray: string[]) {
    try {
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            postId,
            {
                likes: likesArray
            }
        )
        if (!updatedPost) throw Error

        return updatedPost
    } catch (error) {
        console.error(error);
    }
}

export async function savePost(userId: string, postId: string) {
    try {
        const updatedPost = await databases.createDocument(
            appwriteConfig.databaseID,
            appwriteConfig.savesCollectionID,
            ID.unique(),
            {
                users: userId,
                post: postId
            }
        )
        if (!updatedPost) throw Error

        return updatedPost
    } catch (error) {
        console.error(error);
    }
}

export async function deleteSavedPost(savedRecordId: string) {
    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseID,
            appwriteConfig.savesCollectionID,
            savedRecordId,
        )

        if (!statusCode) throw Error

        return { status: 'ok' }
    } catch (error) {
        console.error(error);
    }
}

export async function getPostById(postId?: string) {
    if (!postId) throw Error;

    try {
        const post = await databases.getDocument(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            postId
        )

        if (!post) throw Error

        return post
    } catch (error) {
        console.error(error);
    }
}

export async function updatePost(post: IUpdatePost) {
    const hasFileToUpdate = post.file.length > 0
    try {
        let image = {
            imageUrl: post.imageUrl,
            imageId: post.imageId,
        }

        if (hasFileToUpdate) {
            const uploadedFile = await uploadFile(post.file[0])

            if (!uploadedFile) throw Error

            const fileUrl = getFilePreview(uploadedFile.$id)

            if (!fileUrl) {
                await deleteFile(uploadedFile.$id)
                throw Error
            }

            image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
        }

        const tags = post.tags?.replace(/ /g, "").split(",") || []

        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            post.postId,
            {
                caption: post.caption,
                imageUrl: image.imageUrl,
                imageId: image.imageId,
                location: post.location,
                tags: tags
            }
        )

        if (!updatedPost) {
            await deleteFile(post.imageId)
            throw Error
        }

        return updatedPost
    } catch (error) {
        console.error(error);
    }
}

export async function deletePost(postId?: string, imageId?: string) {
    if (!postId || !imageId) throw Error

    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            postId
        )

        if (!statusCode) throw Error

        await deleteFile(imageId)

        return { status: 'ok' }
    } catch (error) {
        console.error(error);
    }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
    const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(10)]

    if (pageParam) {
        queries.push(Query.cursorAfter(pageParam.toString()))
    }

    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            queries,
        )

        if (!posts) throw Error

        return posts
    } catch (error) {
        console.error(error);
    }
}

export async function searchPosts(searchTerm: string) {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            [Query.search('caption', searchTerm)]
        )

        if (!posts) throw Error

        return posts
    } catch (error) {
        console.error(error);
    }
}