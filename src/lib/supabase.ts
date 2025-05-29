import { createClient } from "@supabase/supabase-js";
import { useEditorStore } from "../store/editorStore";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ensureAuthenticated = async (user_id) => {
  try {
    // Check if we already have a session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (session) {
      // If we have a session, check if the user exists in the users table
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user_id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle null case

      let allChats = [];

      const { data: existingChats, error: allChatsError } = await supabase
        .from("chats")
        .select("id, text, title")
        .eq("user_id", user_id);
      if (!existingChats?.length) {
        // If no chats exist for the user, create a default chat
        const { error: defaultChatError } = await supabase
          .from("chats")
          .insert({
            user_id: user_id,
            title: "Untitled chat",
            text: "",
          });
        const { data: newChats, error: newChatsError } = await supabase
          .from("chats")
          .select("id, text, title")
          .eq("user_id", user_id);
        allChats = newChats || [];
        if (defaultChatError) throw defaultChatError;
      } else {
        allChats = existingChats || [];
      }

      if (!userError && !existingUser) {
        // User doesn't exist in users table, create them
        // Note: The RLS policy will ensure the ID matches the authenticated user
        const { error: insertError } = await supabase
          .from("users")
          .insert({ id: user_id });

        console.log("Insert Error:", insertError);

        // if (insertError) throw insertError;

        const { error: kbError } = await supabase
          .from("knowledge_bases")
          .insert({
            user_id: user_id,
            name: "General",
            description: "General knowledge base",
          })
          .select()
          .single();

        if (insertError) throw kbError;
      } else if (userError && userError.code !== "PGRST116") {
        // Only throw if it's not a "no rows returned" error
        throw userError;
      }

      return { data: { session, allChats } };
    }

    // If no session exists, create a new anonymous user
    const { data, error } = await supabase.auth.signUp({
      email: `${crypto.randomUUID()}@anonymous.com`,
      password: crypto.randomUUID(),
    });

    if (error) throw error;

    if (!data.user) throw new Error("Failed to create user");

    // Create the user in the users table
    // The RLS policy will ensure the ID matches the authenticated user
    const { error: insertError } = await supabase
      .from("users")
      .insert({ id: user_id });
    console.log("Insert Error:", insertError);
    if(insertError){
      window.location.reload()
    }
    if (insertError) throw insertError;

    const { error: kbError } = await supabase
      .from("knowledge_bases")
      .insert({
        user_id: user_id,
        name: "General",
        description: "General knowledge base",
      })
      .select()
      .single();

    if (kbError) throw kbError;

    return { data };
  } catch (error) {
    console.error("Error in ensureAuthenticated:", error);
    throw error;
  }
};
