import { useEffect, useRef, useState } from "react";
import { FiMoreHorizontal, FiPlus, FiTrash2, FiEdit2, FiX } from "react-icons/fi";
import styles from "./styles.module.css";
const columns = [{ id: "todo", name: "To do" }, { id: "doing", name: "In progress" }, { id: "done", name: "Done" }];
const columnIds = new Set(columns.map(({ id }) => id));
const tags = new Set(["Planning", "Writing", "Research", "Design", "Admin"]);
const key = "kanban-board-cards";
const seed = [{ id: "a", title: "Outline the launch notes", column: "todo", tag: "Writing", due: "Today" }, { id: "b", title: "Collect reference screenshots", column: "todo", tag: "Research", due: "Tomorrow" }, { id: "c", title: "Review the first draft", column: "doing", tag: "Writing", due: "Today" }, { id: "d", title: "Set up the project folder", column: "done", tag: "Admin", due: "Yesterday" }];
const load = () => {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return { cards: seed, canPersist: true };

        const data = JSON.parse(stored);
        if (!Array.isArray(data)) return { cards: seed, canPersist: false };

        const seenIds = new Set();
        const cards = data
            .filter((card) => {
                const valid = card && typeof card.id === "string" && card.id && !seenIds.has(card.id) && typeof card.title === "string" && card.title.trim() && columnIds.has(card.column);
                if (valid) seenIds.add(card.id);
                return valid;
            })
            .map((card) => ({
                id: card.id,
                title: card.title,
                column: card.column,
                tag: tags.has(card.tag) ? card.tag : "Planning",
                due: typeof card.due === "string" ? card.due : "No date",
            }));

        const canPersist = cards.length === data.length && data.every((card) => tags.has(card.tag) && typeof card.due === "string");
        return { cards, canPersist };
    } catch {
        return { cards: seed, canPersist: false };
    }
};
const KanbanBoard = () => {
    const [initialData] = useState(load);
    const [cards, setCards] = useState(initialData.cards);
    const [storageWarning, setStorageWarning] = useState(!initialData.canPersist);
    const [menu, setMenu] = useState(null);
    const [onlyColumn, setOnlyColumn] = useState(null);
    const [addColumn, setAddColumn] = useState(null);
    const [form, setForm] = useState({ title: "", tag: "Planning" });
    const [editing, setEditing] = useState(null);
    const [dragId, setDragId] = useState(null);
    const [removing, setRemoving] = useState(null);
    const boardRef = useRef(null);
    const cancelRef = useRef(null);
    const addCardRef = useRef(null);
    const deleteTriggerRef = useRef(null);
    const dialogRef = useRef(null);
    useEffect(() => {
        if (!initialData.canPersist) return;
        try {
            localStorage.setItem(key, JSON.stringify(cards));
            setStorageWarning(false);
        } catch {
            setStorageWarning(true);
        }
    }, [cards, initialData.canPersist]);
    useEffect(() => {
        const onPointer = (event) => { if (!boardRef.current?.contains(event.target)) setMenu(null); };
        const onKey = (event) => { if (event.key === "Escape") { setMenu(null); setRemoving(null); } };
        document.addEventListener("mousedown", onPointer); window.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onPointer); window.removeEventListener("keydown", onKey); };
    }, []);
    useEffect(() => {
        if (removing) {
            cancelRef.current?.focus();
            return;
        }
        if (deleteTriggerRef.current) {
            if (deleteTriggerRef.current.isConnected) deleteTriggerRef.current.focus();
            else addCardRef.current?.focus();
            deleteTriggerRef.current = null;
        }
    }, [removing]);
    const visibleColumns = onlyColumn ? columns.filter((column) => column.id === onlyColumn) : columns;
    const startAdd = (column) => { setEditing(null); setForm({ title: "", tag: "Planning" }); setAddColumn(column); setMenu(null); };
    const submit = (event) => { event.preventDefault(); if (!form.title.trim()) return; if (editing) setCards((items) => items.map((card) => card.id === editing ? { ...card, title: form.title.trim(), tag: form.tag, column: addColumn } : card)); else setCards((items) => [...items, { id: crypto.randomUUID(), title: form.title.trim(), tag: form.tag, column: addColumn, due: "No date" }]); setForm({ title: "", tag: "Planning" }); setEditing(null); setAddColumn(null); };
    const editCard = (card) => { setEditing(card.id); setForm({ title: card.title, tag: card.tag }); setAddColumn(card.column); };
    const moveCard = (id, column) => setCards((items) => items.map((card) => card.id === id ? { ...card, column } : card));
    const requestDelete = (card, event) => { deleteTriggerRef.current = event.currentTarget; setRemoving(card); };
    const trapDialogTab = (event) => {
        if (event.key !== "Tab") return;
        const buttons = dialogRef.current?.querySelectorAll("button:not([disabled])");
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };
    return <section className={styles.boardPage} id="board" ref={boardRef}>
        <div className={styles.heading}><div><p className={styles.label}>Work, in a useful shape</p><h1>Keep the work moving.</h1><p>A simple board for the work that is in front of you.</p></div><button ref={addCardRef} type="button" className={styles.newCard} onClick={() => startAdd("todo")}><FiPlus /> Add a card</button></div>
        <div className={styles.boardToolbar} id="activity"><div><strong aria-live="polite">{cards.length} cards</strong><span>Drag a card across columns to change its status.</span></div>{onlyColumn && <button type="button" onClick={() => setOnlyColumn(null)}>Show full board <FiX /></button>}</div>
        {storageWarning && <p className={styles.storageWarning} role="status">Browser storage is unavailable or saved board data could not be read. Current changes may not persist; saved data was left untouched.</p>}
        {addColumn && <form className={styles.addForm} onSubmit={submit}><div><span>{editing ? "Edit card" : "New card"} in <strong>{columns.find((item) => item.id === addColumn)?.name}</strong></span><button type="button" onClick={() => { setAddColumn(null); setEditing(null); }} aria-label="Close card form"><FiX /></button></div><label>Card title<input autoFocus maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Name the next action" required /></label><label>Label<select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })}><option>Planning</option><option>Writing</option><option>Research</option><option>Design</option><option>Admin</option></select></label><button type="submit" className={styles.submit}>{editing ? "Save changes" : "Add card"}</button></form>}
        <div className={styles.columns}>{visibleColumns.map((column) => {
            const columnCards = cards.filter((card) => card.column === column.id);
            return <section className={styles.column} key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragId) moveCard(dragId, column.id); setDragId(null); }}>
                <header><div><span className={[styles.columnDot, styles[column.id]].join(" ")} /><h2>{column.name}</h2><small>{columnCards.length}</small></div><div className={styles.menuWrap}><button type="button" className={styles.menuButton} aria-label={"Options for " + column.name} aria-haspopup="true" aria-expanded={menu === column.id} onClick={() => setMenu(menu === column.id ? null : column.id)}><FiMoreHorizontal /></button>{menu === column.id && <div className={styles.menu}><button type="button" onClick={() => startAdd(column.id)}><FiPlus />Add card here</button><button type="button" onClick={() => { setOnlyColumn(column.id); setMenu(null); }}>Filter to this column</button><button type="button" onClick={() => { setOnlyColumn(null); setMenu(null); }}>Show full board</button></div>}</div></header>
                <div className={styles.cardStack}>{columnCards.map((card) => <article className={styles.card} key={card.id} draggable onDragStart={() => setDragId(card.id)} onDragEnd={() => setDragId(null)}><div className={styles.cardTop}><span>{card.tag}</span><button type="button" onClick={() => editCard(card)} aria-label={"Edit " + card.title}><FiEdit2 /></button></div><h3>{card.title}</h3><div className={styles.cardBottom}><small>{card.due}</small><label><span className={styles.srOnly}>Move card</span><select aria-label={"Move " + card.title} value={card.column} onChange={(event) => moveCard(card.id, event.target.value)}>{columns.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label><button type="button" onClick={(event) => requestDelete(card, event)} aria-label={"Delete " + card.title}><FiTrash2 /></button></div></article>)}</div>
                <button type="button" className={styles.addInColumn} onClick={() => startAdd(column.id)}><FiPlus /> Add a card</button>
            </section>;
        })}</div>
        {removing && <div className={styles.modal}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-copy" onKeyDown={trapDialogTab}><FiTrash2 aria-hidden="true" /><h2 id="delete-title">Delete this card?</h2><p id="delete-copy"><strong>{removing.title}</strong> will be removed from the board.</p><div><button type="button" ref={cancelRef} onClick={() => setRemoving(null)}>Keep card</button><button type="button" onClick={() => { setCards((items) => items.filter((card) => card.id !== removing.id)); setRemoving(null); }}>Delete card</button></div></section></div>}
    </section>;
};
export default KanbanBoard;
