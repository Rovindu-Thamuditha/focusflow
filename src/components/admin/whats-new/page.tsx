
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';

const ADMIN_EMAIL = 'rovinduthamu@gmail.com';

interface WhatsNew {
  id: string;
  version: string;
  title: string;
  content: string;
  publishedAt: any;
}

export default function WhatsNewAdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WhatsNew | null>(null);
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const whatsnewCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'whatsnew');
  }, [firestore]);

  const whatsnewQuery = useMemoFirebase(() => {
    if (!whatsnewCollectionRef) return null;
    return query(whatsnewCollectionRef, orderBy('publishedAt', 'desc'));
  }, [whatsnewCollectionRef]);

  const { data: announcements, isLoading } = useCollection<WhatsNew>(whatsnewQuery);

  useEffect(() => {
    if (!isUserLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const resetForm = () => {
    setEditingItem(null);
    setVersion('');
    setTitle('');
    setContent('');
  };

  const openForm = (item: WhatsNew | null = null) => {
    if (item) {
      setEditingItem(item);
      setVersion(item.version);
      setTitle(item.title);
      setContent(item.content);
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !title || !content || !firestore) return;

    try {
      if (editingItem) {
        // Update existing item
        const docRef = doc(firestore, 'whatsnew', editingItem.id);
        await updateDoc(docRef, { version, title, content });
        toast({ title: "Success", description: "Announcement updated." });
      } else {
        // Add new item
        await addDoc(collection(firestore, 'whatsnew'), {
          version,
          title,
          content,
          publishedAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "New announcement published." });
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save announcement." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'whatsnew', id));
      toast({ title: "Success", description: "Announcement deleted." });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete announcement." });
    }
  };
  
  if (isUserLoading || !user || user.email !== ADMIN_EMAIL) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={0} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="mb-4">
            <Link href="/admin" passHref>
                <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Admin Panel</Button>
            </Link>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>What's New Management</CardTitle>
                <CardDescription>Create and manage announcements for users.</CardDescription>
            </div>
            <Button onClick={() => openForm()}>
                <PlusCircle className="mr-2" /> Add New
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
                {announcements?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.version}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.publishedAt ? format(item.publishedAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openForm(item)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Create'} Announcement</DialogTitle>
            <DialogDescription>
                Fill out the details for the announcement. Full markdown is supported.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="version">Version (e.g., v1.1.0)</Label>
              <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="content">Content (Markdown supported)</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={12} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
