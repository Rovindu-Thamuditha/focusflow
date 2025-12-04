
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ListChecks } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
}

export function TodoList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newTodo, setNewTodo] = useState('');
  const { toast } = useToast();
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);
  const isAnonymousUser = user?.isAnonymous;

  const todosCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore || isAnonymousUser) return null;
    return collection(firestore, 'users', user.uid, 'todos');
  }, [user, firestore, isAnonymousUser]);

  const { data: cloudTodos, isLoading: cloudLoading } = useCollection<Todo>(todosCollectionRef);

  // Load local todos on mount if anonymous
  useEffect(() => {
    if (isAnonymousUser) {
      const savedTodos = localStorage.getItem('gridFocusTodos');
      if (savedTodos) {
        setLocalTodos(JSON.parse(savedTodos));
      }
    }
  }, [isAnonymousUser]);

  // Save local todos to localStorage
  useEffect(() => {
    if (isAnonymousUser) {
      localStorage.setItem('gridFocusTodos', JSON.stringify(localTodos));
    }
  }, [localTodos, isAnonymousUser]);
  
  const todos = isAnonymousUser ? localTodos : cloudTodos;
  const isLoading = isAnonymousUser ? false : cloudLoading;

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    if (isAnonymousUser) {
        const newLocalTodo: Todo = {
            id: `local-${Date.now()}`,
            text: newTodo,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        setLocalTodos(prev => [newLocalTodo, ...prev]);
        setNewTodo('');
        return;
    }

    if (!todosCollectionRef) return;
    try {
        await addDoc(todosCollectionRef, {
            text: newTodo,
            completed: false,
            createdAt: serverTimestamp(),
        });
        setNewTodo('');
    } catch (error) {
        console.error("Error adding todo: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not add your task. Please try again."
        })
    }
  };

  const toggleTodo = async (todoToToggle: Todo) => {
    if (isAnonymousUser) {
        setLocalTodos(prev => prev.map(t => t.id === todoToToggle.id ? { ...t, completed: !t.completed } : t));
        return;
    }
    
    if (!user || !firestore) return;
    const todoDocRef = doc(firestore, 'users', user.uid, 'todos', todoToToggle.id);
    await updateDoc(todoDocRef, { completed: !todoToToggle.completed });
  };

  const deleteTodo = async (id: string) => {
    if (isAnonymousUser) {
        setLocalTodos(prev => prev.filter(t => t.id !== id));
        return;
    }

    if (!user || !firestore) return;
    const todoDocRef = doc(firestore, 'users', user.uid, 'todos', id);
    await deleteDoc(todoDocRef);
  };
  
  const sortedTodos = todos ? [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds : Date.parse(a.createdAt);
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds : Date.parse(b.createdAt);
    if (dateA > dateB) return -1;
    return 1;
  }) : [];


  return (
    <Card className="bg-card/70 border-2 border-primary/20 hover:border-primary/50 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <ListChecks className="w-8 h-8 text-primary" />
        <div>
          <CardTitle className="text-xl font-bold">Today's Tasks</CardTitle>
          <CardDescription>What do you need to accomplish?</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={addTodo} className="flex gap-2 mb-4">
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
          />
          <Button type="submit">Add</Button>
        </form>

        <ScrollArea className="h-64 pr-4">
          <div className="space-y-3">
            {isLoading && <p className="text-muted-foreground">Loading tasks...</p>}
            {!isLoading && sortedTodos.length === 0 && <p className="text-muted-foreground text-center py-8">No tasks yet. Add one!</p>}
            {sortedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-2 rounded-lg transition-colors bg-background/50 hover:bg-background"
              >
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo)}
                  className="w-5 h-5"
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`flex-grow text-sm ${todo.completed ? 'text-muted-foreground line-through' : ''}`}
                >
                  {todo.text}
                </label>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTodo(todo.id)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
