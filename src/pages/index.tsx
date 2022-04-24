import { FormEvent, Fragment, useRef } from "react";
import Head from "next/head";
import { FaGoogle } from "react-icons/fa";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import { trpc } from "utils/trpc";

export default function Home() {
  const dishList = useRef<HTMLOListElement>(null);
  const { data: session, status } = useSession();
  const client = trpc.useContext();
  const dishes = trpc.useInfiniteQuery(["dish:list", { limit: 3 }], {
    getNextPageParam: lastPage => lastPage.nextCursor
  });

  const createDish = trpc.useMutation(["dish:create"], {
    onSuccess: () => {
      client.invalidateQueries("dish:list");
      dishList.current?.lastElementChild?.scrollIntoView({
        behavior: "smooth"
      });
    }
  });

  const removeDish = trpc.useMutation(["dish:remove"], {
    onSuccess: () => {
      client.invalidateQueries("dish:list");
    }
  });

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const formData = new FormData(form);

    createDish.mutate({ title: String(formData.get("title")) });
    form.reset();
  };

  if (status === "loading") {
    return (
      <main className='h-screen grid place-content-center space-y-6 text-center'>
        <p>Loading ...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className='h-screen grid place-content-center space-y-6 text-center'>
        <Head>
          <title>Testing Next Mutations</title>
        </Head>

        <h1>Testing Next.js Mutations</h1>
        <h2>You must be logged in</h2>
        <button
          className='bg-slate-900 p-4 flex justify-center items-center gap-4'
          onClick={() => signIn("google")}
        >
          <FaGoogle />
          <p>Login with Google</p>
        </button>
      </main>
    );
  }

  return (
    <main className='m-6 space-y-4'>
      <Head>
        <title>Testing Next Mutations - Dishes</title>
      </Head>

      <h1>List of your best dishes</h1>
      <p>Welcome back {session?.user.email}</p>
      <button
        className='bg-red-600 px-4 py-2 rounded-sm'
        onClick={() => signOut()}
      >
        Logout
      </button>

      <form onSubmit={handleSubmit} className='flex gap-2'>
        <input
          className='border-2 border-black px-4 py-2 min-w-[40ch] text-black'
          type='text'
          name='title'
          id='title'
          placeholder='The best dish?'
        />
        <button
          className='bg-slate-900 px-4 py-2 disabled:opacity-40'
          type='submit'
          disabled={createDish.isLoading}
        >
          {createDish.isLoading ? "Creating..." : "Create item"}
        </button>
      </form>

      <ol className='space-y-2' ref={dishList}>
        {dishes.isLoading && <p>Loading...</p>}
        {dishes.isError && (
          <p className='text-red-600'>{dishes.error.message}</p>
        )}
        {!dishes.data || dishes.data.pages.length === 0 ? (
          <p>No dishes found</p>
        ) : (
          dishes.data?.pages.map((page, index) => (
            <Fragment key={index}>
              {page.dishes.map(dish => (
                <li className='flex gap-4' key={dish.id}>
                  <p>
                    {dish.id} - {dish.title}
                  </p>
                  <button
                    className='bg-red-600 px-2 rounded-sm disabled:opacity-40'
                    disabled={removeDish.isLoading}
                    onClick={() => removeDish.mutate({ id: dish.id })}
                  >
                    X
                  </button>
                </li>
              ))}
            </Fragment>
          ))
        )}
      </ol>
      <button
        className='bg-slate-900 px-4 py-2 disabled:opacity-40'
        disabled={!dishes.hasNextPage || dishes.isFetchingNextPage}
        onClick={() => dishes.fetchNextPage()}
      >
        {dishes.isFetchingNextPage
          ? "Loading more..."
          : dishes.hasNextPage
          ? "Load more"
          : "No more dishes to load"}
      </button>
    </main>
  );
}
