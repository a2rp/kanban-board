import { useEffect, useRef, useState } from "react";
import { FiMoreHorizontal, FiPlus, FiTrash2, FiEdit2, FiX } from "react-icons/fi";
import styles from "./styles.module.css";
const columns = [{ id: "todo", name: "To do" }, { id: "doing", name: "In progress" }, { id: "done", name: "Done" }];
const key = "kanban-board-cards";
const seed = [{ id: "a", title: "Outline the launch notes", column: "todo", tag: "Writing", due: "Today" }, { id: "b", title: "Collect reference screenshots", column: "todo", tag: "Research", due: "Tomorrow" }, { id: "c", title: "Review the first draft", column: "doing", tag: "Writing", due: "Today" }, { id: "d", title: "Set up the project folder", column: "done", tag: "Admin", due: "Yesterday" }];
const load = () => { try { const data = JSON.parse(localStorage.getItem(key)); return Array.isArray(data) ? data : seed; } catch { return seed; } };
const KanbanBoard = () => {
    const [cards, setCards] = useState(load);
    const [menu, setMenu] = useState(null);
    const [onlyColumn, setOnlyColumn] = useState(null);
    const [addColumn, setAddColumn] = useState(null);
    const [form, setForm] = useState({ title: "", tag: "Planning" });
    const [editing, setEditing] = useState(null);
    const [dragId, setDragId] = useState(null);
    const [removing, setRemoving] = useState(null);
    const boardRef = useRef(null);
    const cancelRef = useRef(null);
    useEffect(() => localStorage.setItem(key, JSON.stringify(cards)), [cards]);
    useEffect(() => {
        const onPointer = (event) => { if (!boardRef.current?.contains(event.target)) setMenu(null); };
        const onKey = (event) => { if (event.key === "Escape") { setMenu(null); setRemoving(null); } };
        document.addEventListener("mousedown", onPointer); window.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onPointer); window.removeEventListener("keydown", onKey); };
    }, []);
    useEffect(() => { if (removing) cancelRef.current?.focus(); }, [removing]);
    const visibleColumns = onlyColumn ? columns.filter((column) => column.id === onlyColumn) : columns;
    const startAdd = (column) => { setEditing(null); setForm({ title: "", tag: "Planning" }); setAddColumn(column); setMenu(null); };
    const submit = (event) => { event.preventDefault(); if (!form.title.trim()) return; if (editing) setCards((items) => items.map((card) => card.id === editing ? { ...card, title: form.title.trim(), tag: form.tag, column: addColumn } : card)); else setCards((items) => [...items, { id: crypto.randomUUID(), title: form.title.trim(), tag: form.tag, column: addColumn, due: "No date" }]); setForm({ title: "", tag: "Planning" }); setEditing(null); setAddColumn(null); };
    const editCard = (card) => { setEditing(card.id); setForm({ title: card.title, tag: card.tag }); setAddColumn(card.column); };
    const moveCard = (id, column) => setCards((items) => items.map((card) => card.id === id ? { ...card, column } : card));
    return <section className={styles.boardPage} id="board" ref={boardRef}>
        <div className={styles.heading}><div><p className={styles.label}>Work, in a useful shape</p><h1>Keep the work moving.</h1><p>A simple board for the work that is in front of you.</p></div><button className={styles.newCard} onClick={() => startAdd("todo")}><FiPlus /> Add a card</button></div>
        <div className={styles.boardToolbar} id="activity"><div><strong>{cards.length} cards</strong><span>Drag a card across columns to change its status.</span></div>{onlyColumn && <button onClick={() => setOnlyColumn(null)}>Show full board <FiX /></button>}</div>
        {addColumn && <form className={styles.addForm} onSubmit={submit}><div><span>{editing ? "Edit card" : "New card"} in <strong>{columns.find((item) => item.id === addColumn)?.name}</strong></span><button type="button" onClick={() => { setAddColumn(null); setEditing(null); }} aria-label="Close card form"><FiX /></button></div><label>Card title<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Name the next action" required /></label><label>Label<select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })}><option>Planning</option><option>Writing</option><option>Research</option><option>Design</option><option>Admin</option></select></label><button className={styles.submit}>{editing ? "Save changes" : "Add card"}</button></form>}
        <div className={styles.columns}>{visibleColumns.map((column) => {
            const columnCards = cards.filter((card) => card.column === column.id);
            return <section className={styles.column} key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragId) moveCard(dragId, column.id); setDragId(null); }}>
                <header><div><span className={[styles.columnDot, styles[column.id]].join(" ")} /><h2>{column.name}</h2><small>{columnCards.length}</small></div><div className={styles.menuWrap}><button className={styles.menuButton} aria-label={"Options for " + column.name} aria-expanded={menu === column.id} onClick={() => setMenu(menu === column.id ? null : column.id)}><FiMoreHorizontal /></button>{menu === column.id && <div className={styles.menu} role="menu"><button role="menuitem" onClick={() => startAdd(column.id)}><FiPlus />Add card here</button><button role="menuitem" onClick={() => { setOnlyColumn(column.id); setMenu(null); }}>Filter to this column</button><button role="menuitem" onClick={() => { setOnlyColumn(null); setMenu(null); }}>Show full board</button></div>}</div></header>
                <div className={styles.cardStack}>{columnCards.map((card) => <article className={styles.card} key={card.id} draggable onDragStart={() => setDragId(card.id)} onDragEnd={() => setDragId(null)}><div className={styles.cardTop}><span>{card.tag}</span><button onClick={() => editCard(card)} aria-label={"Edit " + card.title}><FiEdit2 /></button></div><h3>{card.title}</h3><div className={styles.cardBottom}><small>{card.due}</small><label><span className={styles.srOnly}>Move card</span><select aria-label={"Move " + card.title} value={card.column} onChange={(event) => moveCard(card.id, event.target.value)}>{columns.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label><button onClick={() => setRemoving(card)} aria-label={"Delete " + card.title}><FiTrash2 /></button></div></article>)}</div>
                <button className={styles.addInColumn} onClick={() => startAdd(column.id)}><FiPlus /> Add a card</button>
            </section>;
        })}</div>
        {removing && <div className={styles.modal}><section role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-copy"><FiTrash2 /><h2 id="delete-title">Delete this card?</h2><p id="delete-copy"><strong>{removing.title}</strong> will be removed from the board.</p><div><button ref={cancelRef} onClick={() => setRemoving(null)}>Keep card</button><button onClick={() => { setCards((items) => items.filter((card) => card.id !== removing.id)); setRemoving(null); }}>Delete card</button></div></section></div>}
    </section>;
};
export default KanbanBoard;
