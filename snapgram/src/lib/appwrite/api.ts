import { ID, Query } from "appwrite";

import { account, appwriteConfig, avatars, databases } from "./config";
import { INewUser } from "@/types";

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

        // console.log(currentUser.documents[0])
        return currentUser.documents[0]
    } catch (error) {
        console.error(error);
        return null
    }
}