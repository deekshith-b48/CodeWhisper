# Supabase Setup Guide for CodeWhisperer

## 🔑 **Step 1: Get Your Supabase Anon Key**

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Settings** → **API**
3. Copy the **anon public** key
4. Update your `.env` file:

```bash
# Replace 'your-supabase-anon-key-here' with your actual anon key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🗄️ **Step 2: Set Up Database Tables**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content of `supabase-setup.sql`
4. Click **Run** to create all tables and policies

## 🔐 **Step 3: Configure Authentication**

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Enable **Email** provider if not already enabled
3. Set **Site URL** to: `http://localhost:5175`
4. Add **Redirect URLs**:
   - `http://localhost:5175`
   - `http://localhost:5175/**`

## 🚀 **Step 4: Test the Application**

1. Restart your development server:
   ```bash
   cd /home/darktunnel/Downloads/CodeWhisperer_Complete_Project/codewhisperer-frontend
   pnpm dev --port 5175
   ```

2. Open http://localhost:5175

3. Try signing up as an admin:
   - Email: admin@example.com
   - Password: password123
   - Role: Admin

4. Try signing up as a joinee:
   - Email: joinee@example.com  
   - Password: password123
   - Role: Joinee

## 📋 **What the Database Setup Includes:**

### **Tables Created:**
- `users` - User profiles with roles (admin/joinee)
- `onboarding_tasks` - Task definitions created by admins
- `user_task_progress` - Individual user progress on tasks
- `knowledge_documents` - Uploaded documents and knowledge base
- `chat_queries` - Chat history and AI responses

### **Sample Data:**
- 5 sample onboarding tasks across different categories
- Proper indexing for performance
- Row Level Security (RLS) policies for data protection

### **Security Features:**
- Users can only access their own data
- Admins have additional permissions for task and document management
- Automatic user profile creation on signup
- Secure authentication with Supabase Auth

## 🔧 **Troubleshooting:**

### **Issue: Authentication errors**
- Verify your anon key is correct
- Check that Site URL and Redirect URLs are properly configured

### **Issue: Database access errors**
- Ensure you've run the SQL setup script completely
- Check that RLS policies are enabled

### **Issue: Missing features**
- Verify all tables were created successfully
- Check browser console for specific error messages

## 🎯 **Next Steps:**

Once everything is working:
1. Customize the onboarding tasks for your organization
2. Upload your actual knowledge base documents
3. Configure production environment variables
4. Deploy to your preferred hosting platform

Your Supabase URL: `https://syoygenioemredodiezr.supabase.co`
Your Database: `postgres`

The application now has full database persistence and will save all user data, tasks, documents, and chat history!
