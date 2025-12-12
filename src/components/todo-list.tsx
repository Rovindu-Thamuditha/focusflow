
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, orderBy } from 'firebase/firestore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ListChecks, GripVertical, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Todo } from '@/lib/types';
import { cn } from '@/lib/utils';

// Enhanced Todo type for UI
type HierarchicalTodo = Todo & {
  subtasks: HierarchicalTodo[];
};

// Sub-component for a single Todo item
const SortableTodoItem = React.memo(({
  todo,
  onToggle,
  onDelete,
  onAddSubtask,
  isCollapsed,
  onToggleCollapse,
  renderSubtasks
}: {
  todo: HierarchicalTodo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (parentId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  renderSubtasks: (tasks: HierarchicalTodo[], parentId: string) => React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 p-2 rounded-lg transition-colors bg-background/50 hover:bg-background group">
        <button {...attributes} {...listeners} className="cursor-grab p-1">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>
        {hasSubtasks ? (
          <button onClick={() => onToggleCollapse(todo.id)} className="p-1">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-6" /> // Placeholder for alignment
        )}
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo)}
          className="w-5 h-5"
        />
        <label
          htmlFor={`todo-${todo.id}`}
          className={cn('flex-grow text-sm', todo.completed && 'text-muted-foreground line-through')}
        >
          {todo.text}
        </label>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => onAddSubtask(todo.id)}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => onDelete(todo.id)}>
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
      {hasSubtasks && !isCollapsed && (
        <div className="ml-8 pl-4 border-l border-dashed">
            {renderSubtasks(todo.subtasks, todo.id)}
        </div>
      )}
    </div>
  );
});
SortableTodoItem.displayName = 'SortableTodoItem';


export function TodoList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newTodo, setNewTodo] = useState('');
  const { toast } = useToast();
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);
  const isAnonymousUser = user?.isAnonymous;
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());

  const todosQuery = useMemoFirebase(() => {
    if (!user || !firestore || isAnonymousUser) return null;
    return query(collection(firestore, 'users', user.uid, 'todos'), orderBy('order'));
  }, [user, firestore, isAnonymousUser]);

  const { data: cloudTodos, isLoading: cloudLoading } = useCollection<Todo>(todosQuery);

  useEffect(() => {
    if (isAnonymousUser) {
      const savedTodos = localStorage.getItem('gridFocusTodos');
      if (savedTodos) {
        setLocalTodos(JSON.parse(savedTodos));
      }
    }
  }, [isAnonymousUser]);

  useEffect(() => {
    if (isAnonymousUser) {
      localStorage.setItem('gridFocusTodos', JSON.stringify(localTodos));
    }
  }, [localTodos, isAnonymousUser]);

  const allTodos = useMemo(() => (isAnonymousUser ? localTodos : cloudTodos) || [], [isAnonymousUser, localTodos, cloudTodos]);

  const hierarchicalTodos = useMemo((): HierarchicalTodo[] => {
    const todoMap: Map<string, HierarchicalTodo> = new Map();
    const rootTodos: HierarchicalTodo[] = [];

    allTodos.forEach(todo => {
      todoMap.set(todo.id, { ...todo, subtasks: [] });
    });

    allTodos.forEach(todo => {
      if (todo.parentId && todoMap.has(todo.parentId)) {
        const parent = todoMap.get(todo.parentId)!;
        parent.subtasks.push(todoMap.get(todo.id)!);
      } else {
        rootTodos.push(todoMap.get(todo.id)!);
      }
    });
    
    rootTodos.forEach(todo => {
        if(todo.subtasks.length > 0) {
            todo.subtasks.sort((a,b) => a.order - b.order);
        }
    })

    return rootTodos.sort((a, b) => a.order - b.order);
  }, [allTodos]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    const text = newTodo;
    setNewTodo('');

    const maxOrder = allTodos.reduce((max, t) => (t.parentId === null ? Math.max(max, t.order) : max), -1);

    if (isAnonymousUser) {
      const newLocalTodo: Todo = {
        id: `local-${Date.now()}`,
        text,
        completed: false,
        createdAt: new Date().toISOString(),
        userId: 'anonymous',
        order: maxOrder + 1,
        parentId: null,
      };
      setLocalTodos(prev => [...prev, newLocalTodo]);
      return;
    }

    if (!user || !firestore) return;
    try {
      await addDoc(collection(firestore, 'users', user.uid, 'todos'), {
        text,
        completed: false,
        createdAt: serverTimestamp(),
        userId: user!.uid,
        order: maxOrder + 1,
        parentId: null,
      });
    } catch (error) {
      console.error("Error adding todo: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add your task." });
    }
  };

  const handleAddSubtask = (parentId: string) => {
    const text = prompt("Enter sub-task name:");
    if(!text || !text.trim()) return;

    const maxOrder = allTodos.reduce((max, t) => (t.parentId === parentId ? Math.max(max, t.order) : max), -1);

    if (isAnonymousUser) {
        const newLocalTodo: Todo = {
          id: `local-${Date.now()}`,
          text,
          completed: false,
          createdAt: new Date().toISOString(),
          userId: 'anonymous',
          order: maxOrder + 1,
          parentId: parentId,
        };
        setLocalTodos(prev => [...prev, newLocalTodo]);
        return;
    }

    if (!user || !firestore) return;
    addDoc(collection(firestore, 'users', user.uid, 'todos'), {
        text,
        completed: false,
        createdAt: serverTimestamp(),
        userId: user!.uid,
        order: maxOrder + 1,
        parentId: parentId,
      }).catch(error => {
        console.error("Error adding sub-task: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not add sub-task." });
      });
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
    const subtasks = allTodos.filter(t => t.parentId === id);

    if (isAnonymousUser) {
        const idsToDelete = [id, ...subtasks.map(t => t.id)];
        setLocalTodos(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        return;
    }

    if (!user || !firestore) return;

    const batch = writeBatch(firestore);
    const todoDocRef = doc(firestore, 'users', user.uid, 'todos', id);
    batch.delete(todoDocRef);
    subtasks.forEach(subtask => {
        const subtaskDocRef = doc(firestore, 'users', user.uid, 'todos', subtask.id);
        batch.delete(subtaskDocRef);
    })
    await batch.commit();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const activeTodo = allTodos.find(t => t.id === active.id);
    const overTodo = allTodos.find(t => t.id === over.id);
    
    if(!activeTodo || !overTodo || activeTodo.parentId !== overTodo.parentId) return;

    const itemsInSameContext = allTodos.filter(t => t.parentId === activeTodo.parentId);
    const oldIndex = itemsInSameContext.findIndex(t => t.id === active.id);
    const newIndex = itemsInSameContext.findIndex(t => t.id === over.id);

    const reorderedItems = arrayMove(itemsInSameContext, oldIndex, newIndex);

    if (isAnonymousUser) {
        const otherItems = allTodos.filter(t => t.parentId !== activeTodo.parentId);
        setLocalTodos([...otherItems, ...reorderedItems]);
        return;
    }

    if (!user || !firestore) return;

    const batch = writeBatch(firestore);
    reorderedItems.forEach((todo, index) => {
      const docRef = doc(firestore, 'users', user.uid, 'todos', todo.id);
      if (todo.order !== index) {
        batch.update(docRef, { order: index });
      }
    });
    
    try {
        await batch.commit();
        toast({title: "Tasks reordered"});
    } catch(e) {
        console.error("Failed to reorder tasks", e);
        toast({variant: "destructive", title: "Error", description: "Failed to save new task order."});
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedTasks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }

  const renderSortableList = (tasks: HierarchicalTodo[], parentId: string | null) => {
      const items = tasks.map(t => t.id);
      return (
         <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
                {tasks.map(todo => (
                    <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onAddSubtask={handleAddSubtask}
                        isCollapsed={collapsedTasks.has(todo.id)}
                        onToggleCollapse={toggleCollapse}
                        renderSubtasks={renderSortableList}
                    />
                ))}
            </div>
        </SortableContext>
      );
  }

  return (
    <Card className="bg-card/70 border-2 border-primary/20 hover:border-primary/50 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
        <ListChecks className="w-6 h-6 text-primary" />
        <div>
          <CardTitle className="text-lg font-bold">Today's Tasks</CardTitle>
          <CardDescription className="text-xs">Your daily checklist.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form onSubmit={addTodo} className="flex gap-2 mb-4">
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
            className="h-9"
          />
          <Button type="submit" size="sm">Add</Button>
        </form>

        <ScrollArea className="h-56 pr-3">
            {cloudLoading && <p className="text-muted-foreground text-sm">Loading tasks...</p>}
            {!cloudLoading && hierarchicalTodos.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No tasks yet. Add one!</p>}
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {renderSortableList(hierarchicalTodos, null)}
            </DndContext>

        </ScrollArea>
      </CardContent>
    </Card>
  );
}
