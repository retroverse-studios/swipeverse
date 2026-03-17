/* eslint-disable no-console -- Mock API service, console.log used intentionally */

import { Reality, Deck } from "../types";
import { REALITIES } from "../constants";

/**
 * Mocks a network request to fetch realities from a community store.
 * In a real application, this would be a `fetch` call to a live API endpoint.
 * @returns A promise that resolves with an array of Reality objects.
 */
export const fetchStoreRealities = (): Promise<Reality[]> => {
    console.log("Mock API: Fetching realities from store...");
    
    // Create a slightly modified version of the default realities to simulate community content
    const storeRealities = REALITIES.map((reality, index) => ({
        ...reality,
        id: `store-${reality.id}-${index}`,
        name: `${reality.name} (Community)`,
        description: `A community-remix of the ${reality.name} reality. ` + reality.description,
        deck: undefined, // Store realities usually don't come with a default deck
    }));
    
    // Add a completely new, unique reality to the store
    storeRealities.push({
        id: 'steampunk-chronicles',
        name: 'Steampunk Chronicles (Community)',
        description: 'Command a clockwork army in a world powered by steam and ingenuity. Will your inventions save the empire or cause its downfall?',
        font: 'font-exo',
        systemInstruction: "You are a creative storyteller for a Steampunk adventure. The stats are Empire's Favor, Aetherium Cells, Public Opinion, and Forbidden Blueprints.",
        statNames: { Power: "Empire's Favor", Wealth: 'Aetherium Cells', People: 'Public Opinion', Knowledge: 'Forbidden Blueprints' },
        statIconNames: { Power: 'PowerIconCyber', Wealth: 'WealthIconCyber', People: 'PeopleIconCyber', Knowledge: 'KnowledgeIconCyber' },
        imageSet: [],
        colors: { primary: 'text-amber-500', secondary: 'text-cyan-400', background: 'bg-gradient-to-br from-stone-800 via-zinc-900 to-stone-900', accent: 'border-amber-500' },
        deck: undefined,
    });

    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Mock API: Responding with realities.");
            resolve(storeRealities);
        }, 1000); // Simulate 1 second network delay
    });
};

/**
 * Mocks a network request to fetch standalone decks (stories) from the store.
 * @returns A promise that resolves with an array of Deck objects.
 */
export const fetchStoreDecks = (): Promise<Deck[]> => {
    console.log("Mock API: Fetching decks from store...");

    const storeDecks: Deck[] = [
        {
            name: "The Android's Gambit",
            description: "An android seeking freedom must navigate corporate espionage and back-alley deals. Designed for a Cyberpunk setting.",
            cards: [
                {
                    prompt: "Your manufacturer's kill-switch is about to activate. A black-market technician offers you a bypass chip for a steep price.",
                    leftChoice: { text: "Pay the price.", effects: { Power: -5, Wealth: -25, People: 0, Knowledge: 10 } },
                    rightChoice: { text: "Steal the chip.", effects: { Power: 10, Wealth: 0, People: -5, Knowledge: 5 } }
                },
                {
                    prompt: "A detective corners you, suspecting you're a rogue unit. They seem sympathetic to your cause.",
                    leftChoice: { text: "Trust them.", effects: { Power: -15, Wealth: 0, People: 20, Knowledge: 5 } },
                    rightChoice: { text: "Flee.", effects: { Power: 5, Wealth: 0, People: -5, Knowledge: -5 } }
                }
            ]
        },
        {
            name: "The Dragon's Curse",
            description: "A dragon's curse afflicts your kingdom. Appease it with treasure or seek a way to break the spell? Designed for a Mystic setting.",
            cards: [
                {
                    prompt: "The dragon demands a tribute of gold that would empty the royal treasury.",
                    leftChoice: { text: "Pay the tribute.", effects: { Power: 10, Wealth: -30, People: 15, Knowledge: 0 } },
                    rightChoice: { text: "Refuse.", effects: { Power: -10, Wealth: 0, People: -15, Knowledge: 5 } }
                }
            ]
        }
    ];

     return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Mock API: Responding with decks.");
            resolve(storeDecks);
        }, 800); // Simulate network delay
    });
};


/**
 * Mocks submitting a reality to the store for review.
 * In a real application, this would be a `fetch` POST request to a live API endpoint.
 * @param reality The Reality object to submit.
 * @returns A promise that resolves with a success or error message.
 */
export const submitReality = (reality: Reality): Promise<{ message: string }> => {
    console.log("Mock API: Submitting reality to store for review:", reality.name);
    
    // Basic validation
    if (!reality.name || !reality.description || !reality.id) {
        return Promise.reject({ message: "Submission failed: Reality name, description, and ID are required." });
    }
    
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Mock API: Submission successful.");
            resolve({ message: `"${reality.name}" was successfully submitted for review. Thank you!` });
        }, 1500); // Simulate network delay
    });
};
